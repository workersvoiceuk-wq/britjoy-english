-- Stripe can still send events for an account that was deleted (for example the
-- cancellation that account-delete triggers). Record them without the user so the
-- webhook answers 200 instead of failing and being retried for days.
create or replace function public.apply_purchase(
  p_event text, p_user uuid, p_product text, p_credits integer,
  p_plus_until timestamptz, p_amount integer, p_currency text, p_customer text
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from auth.users where id = p_user) then
    insert into public.purchases (stripe_event_id, user_id, product, credits, amount_total, currency)
      values (p_event, null, p_product, coalesce(p_credits, 0), p_amount, p_currency)
      on conflict (stripe_event_id) do nothing;
    return false;
  end if;
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

revoke all on function public.apply_purchase(text, uuid, text, integer, timestamptz, integer, text, text) from public, anon, authenticated;
grant execute on function public.apply_purchase(text, uuid, text, integer, timestamptz, integer, text, text) to service_role;
