-- VUM Academy (sold on vozunidamundo.com, same Stripe account) unlocks the
-- BritJoy app's paid features for the account with the same, verified email.
-- The Edge Functions need to find that account from a Stripe customer's email.
create function public.user_id_by_email(p_email text)
returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users
  where lower(email) = lower(trim(p_email)) and email_confirmed_at is not null
  order by created_at
  limit 1;
$$;

revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;
