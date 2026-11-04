-- Britjoy English · accounts, Britjoy Plus (premium) and AI credits.
--
-- Learning progress stays on the device. The server only keeps what is needed to
-- sell and honour Plus and AI credits: the account's email (Supabase Auth), the
-- Plus end date, the credit balance, today's free AI messages and the purchases.
-- Clients can READ their own row; every WRITE goes through the Edge Functions
-- (service role), so nobody can grant themselves Plus or credits from the app.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plus_until timestamptz,
  credits integer not null default 0 check (credits >= 0),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  messages integer not null default 0,
  primary key (user_id, day)
);

-- One row per processed Stripe event, so retried webhooks are applied only once.
create table public.purchases (
  stripe_event_id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  product text not null,
  credits integer not null default 0,
  amount_total integer,
  currency text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.ai_usage enable row level security;
alter table public.purchases enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "read own ai usage" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "read own purchases" on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);

-- A profile row for every new account.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Spends one AI message atomically: Plus members get p_plus_daily messages a day
-- (fair use, so one very heavy user cannot cost more than the subscription),
-- everyone else p_free_daily; after that each message costs one credit.
-- Returns how it was paid, or 'none'.
create function public.spend_ai_message(p_user uuid, p_free_daily integer, p_plus_daily integer)
returns table (paid_with text, free_left integer, credits integer)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_profile public.profiles%rowtype;
  v_used integer;
begin
  insert into public.profiles (id) values (p_user) on conflict (id) do nothing;
  select * into v_profile from public.profiles where id = p_user for update;

  insert into public.ai_usage (user_id, day, messages) values (p_user, current_date, 0)
    on conflict (user_id, day) do nothing;
  select messages into v_used from public.ai_usage
    where user_id = p_user and day = current_date for update;

  if v_profile.plus_until is not null and v_profile.plus_until > now() and v_used < p_plus_daily then
    update public.ai_usage set messages = messages + 1 where user_id = p_user and day = current_date;
    return query select 'plus'::text, p_plus_daily - v_used - 1, v_profile.credits;
  elsif (v_profile.plus_until is null or v_profile.plus_until <= now()) and v_used < p_free_daily then
    update public.ai_usage set messages = messages + 1 where user_id = p_user and day = current_date;
    return query select 'free'::text, p_free_daily - v_used - 1, v_profile.credits;
  elsif v_profile.credits > 0 then
    update public.profiles set credits = credits - 1 where id = p_user;
    return query select 'credit'::text, 0, v_profile.credits - 1;
  else
    return query select 'none'::text, 0, v_profile.credits;
  end if;
end;
$$;

-- Gives back a message when the tutor could not answer.
create function public.refund_ai_message(p_user uuid, p_paid_with text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_paid_with = 'credit' then
    update public.profiles set credits = credits + 1 where id = p_user;
  elsif p_paid_with in ('free', 'plus') then
    update public.ai_usage set messages = greatest(messages - 1, 0)
      where user_id = p_user and day = current_date;
  end if;
end;
$$;

-- Applies a Stripe event once: credits and/or a new Plus end date.
create function public.apply_purchase(
  p_event text, p_user uuid, p_product text, p_credits integer,
  p_plus_until timestamptz, p_amount integer, p_currency text, p_customer text
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.purchases (stripe_event_id, user_id, product, credits, amount_total, currency)
    values (p_event, p_user, p_product, coalesce(p_credits, 0), p_amount, p_currency)
    on conflict (stripe_event_id) do nothing;
  if not found then
    return false; -- already applied
  end if;
  insert into public.profiles (id) values (p_user) on conflict (id) do nothing;
  update public.profiles set
    credits = credits + coalesce(p_credits, 0),
    plus_until = coalesce(p_plus_until, plus_until),
    stripe_customer_id = coalesce(p_customer, stripe_customer_id)
  where id = p_user;
  return true;
end;
$$;

-- Only the Edge Functions (service role) may call these.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.spend_ai_message(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_message(uuid, text) from public, anon, authenticated;
revoke all on function public.apply_purchase(text, uuid, text, integer, timestamptz, integer, text, text) from public, anon, authenticated;
grant execute on function public.spend_ai_message(uuid, integer, integer) to service_role;
grant execute on function public.refund_ai_message(uuid, text) to service_role;
grant execute on function public.apply_purchase(text, uuid, text, integer, timestamptz, integer, text, text) to service_role;
