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
    (current_status in ('searching', 'accepted', 'arriving') and p_next_status = 'cancelled') or
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

create function public.transition_driver_ride(p_ride_id uuid, p_next_status text)
returns setof public.rides
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  if not exists (
    select 1 from public.drivers where user_id = (select auth.uid())
  ) then
    raise exception 'Driver account not found';
  end if;

  select r.status into current_status
  from public.rides as r
  where r.id = p_ride_id and r.assigned_driver_id = (select auth.uid())
  for update;

  if current_status is null then
    raise exception 'Ride not found';
  end if;

  if not (
    (current_status = 'accepted' and p_next_status = 'arriving') or
    (current_status = 'arriving' and p_next_status = 'in_progress') or
    (current_status = 'in_progress' and p_next_status = 'completed')
  ) then
    raise exception 'Invalid ride status transition';
  end if;

  return query
  update public.rides as r
  set status = p_next_status,
      completed_at = case when p_next_status = 'completed' then now() else r.completed_at end
  where r.id = p_ride_id
  returning r.*;

  if p_next_status = 'completed' then
    update public.drivers
    set trips = trips + 1
    where user_id = (select auth.uid());
  end if;
end;
$$;

revoke all on function public.transition_driver_ride(uuid, text) from public;
grant execute on function public.transition_driver_ride(uuid, text) to authenticated;