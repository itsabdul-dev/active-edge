-- Only trusted server functions can consume limits; raw IP addresses are never stored.
create table private.request_limit (
  key text primary key check (length(key) = 64),
  requests integer not null check (requests > 0),
  expires_at timestamptz not null
);
create index request_limit_expiry_idx on private.request_limit(expires_at);
alter table private.request_limit enable row level security;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.request_limit to service_role;

create function public.consume_request_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  if p_key is null or length(p_key) <> 64 or p_limit is null or p_limit not between 1 and 10000
    or p_window_seconds is null or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid request limit';
  end if;
  delete from private.request_limit where expires_at < now();
  insert into private.request_limit as r(key, requests, expires_at)
    values(p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict(key) do update set
    requests = case when r.expires_at <= now() then 1 else least(r.requests + 1, p_limit + 1) end,
    expires_at = case when r.expires_at <= now() then now() + make_interval(secs => p_window_seconds) else r.expires_at end
  returning requests into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_request_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_request_limit(text,integer,integer) to service_role;
