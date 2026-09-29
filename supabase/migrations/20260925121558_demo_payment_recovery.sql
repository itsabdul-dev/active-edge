create function public.get_demo_payment(p_attempt_id uuid,p_token_hash text,p_customer_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
  select a.result into result from private.demo_payment_attempt a join public.cart c using(cart_id)
    where a.attempt_id=p_attempt_id and ((p_customer_id is not null and c.customer_id=p_customer_id)
    or (p_customer_id is null and c.customer_id is null and c.session_token_hash=p_token_hash));
  return result;
end $$;
revoke all on function public.get_demo_payment(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.get_demo_payment(uuid,text,uuid) to service_role;
