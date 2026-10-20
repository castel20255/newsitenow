do $$
begin
  if not exists (
    select 1
    from auth.users
    where id = '52a5bc45-c1bd-4e68-b105-4defb2991d86'::uuid
      and email is not null
  ) then
    raise exception 'Supabase user 52a5bc45-c1bd-4e68-b105-4defb2991d86 was not found or has no email';
  end if;
end;
$$;

insert into public.site_admins (email)
select lower(email)
from auth.users
where id = '52a5bc45-c1bd-4e68-b105-4defb2991d86'::uuid
on conflict (email) do nothing;