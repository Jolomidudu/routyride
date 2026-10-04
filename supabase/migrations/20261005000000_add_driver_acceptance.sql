create table public.drivers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  rating numeric(2, 1) not null default 5.0 check (rating between 0 and 5),
  trips integer not null default 0 check (trips >= 0),
  car text not null check (char_length(car) between 1 and 120),
  plate text not null check (char_length(plate) between 1 and 32),
  created_at timestamptz not null default now()
);

alter table public.rides
  add column assigned_driver_id uuid references public.drivers (user_id);

create index rides_open_requests_idx
  on public.rides (created_at) where status = 'searching' and assigned_driver_id is null;

alter table public.drivers enable row level security;

create function public.can_view_driver_profile(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rides as r
    where r.assigned_driver_id = p_driver_id
      and r.rider_id = (select auth.uid())
  );
$$;

revoke all on function public.can_view_driver_profile(uuid) from public;
grant execute on function public.can_view_driver_profile(uuid) to authenticated;

create policy "Authenticated users can read driver profiles"
  on public.drivers for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_view_driver_profile(user_id)
  );
grant select on public.drivers to authenticated;

create policy "Drivers can read open and assigned rides"
  on public.rides for select
  to authenticated
  using (
    (
      status = 'searching' and assigned_driver_id is null
      and exists (select 1 from public.drivers where user_id = (select auth.uid()))
    )
    or assigned_driver_id = (select auth.uid())
  );

create or replace function public.accept_ride(p_ride_id uuid)
returns setof public.rides
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.drivers where user_id = (select auth.uid())
  ) then
    raise exception 'Driver account not found';
  end if;

  return query
  update public.rides as r
  set status = 'accepted', assigned_driver_id = (select auth.uid())
  where r.id = p_ride_id
    and r.status = 'searching'
    and r.assigned_driver_id is null
  returning r.*;

  if not found then
    raise exception 'Ride is no longer available';
  end if;
end;
$$;

revoke all on function public.accept_ride(uuid) from public;
grant execute on function public.accept_ride(uuid) to authenticated;

create or replace function public.transition_ride(p_ride_id uuid, p_next_status text)
returns setof public.rides
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  select r.status into current_status
  from public.rides as r
  where r.id = p_ride_id and r.rider_id = (select auth.uid())
  for update;

  if current_status is null then
    raise exception 'Ride not found';
  end if;

  if not (
    (current_status in ('searching', 'accepted') and p_next_status = 'cancelled') or
    (current_status = 'accepted' and p_next_status = 'completed') or
    (current_status = 'scheduled' and p_next_status = 'cancelled')
  ) then
    raise exception 'Invalid ride status transition';
  end if;

  return query
  update public.rides as r
  set status = p_next_status
  where r.id = p_ride_id
  returning r.*;
end;
$$;

revoke all on function public.transition_ride(uuid, text) from public;
grant execute on function public.transition_ride(uuid, text) to authenticated;