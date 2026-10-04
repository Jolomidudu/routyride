create table public.rides (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references auth.users (id) on delete cascade,
  pickup text not null check (char_length(pickup) between 1 and 200),
  destination text not null check (char_length(destination) between 1 and 200),
  option_id text not null check (option_id in ('economy', 'comfort', 'suv', 'premium')),
  price integer not null check (price >= 0),
  payment_method text not null check (payment_method in ('Cash', 'Card', 'Wallet')),
  status text not null default 'requested'
    check (status in ('requested', 'searching', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled', 'scheduled')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint scheduled_rides_have_time check (status <> 'scheduled' or scheduled_for is not null)
);

create index rides_rider_created_at_idx on public.rides (rider_id, created_at desc);

alter table public.rides enable row level security;

create policy "Riders can read their own rides"
  on public.rides for select
  to authenticated
  using ((select auth.uid()) = rider_id);

create policy "Riders can create their own rides"
  on public.rides for insert
  to authenticated
  with check ((select auth.uid()) = rider_id);

grant select, insert on public.rides to authenticated;

create function public.transition_ride(p_ride_id uuid, p_next_status text)
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
  where r.id = p_ride_id and r.rider_id = auth.uid()
  for update;

  if current_status is null then
    raise exception 'Ride not found';
  end if;

  if not (
    (current_status = 'searching' and p_next_status in ('arriving', 'cancelled')) or
    (current_status = 'arriving' and p_next_status in ('completed', 'cancelled')) or
    (current_status = 'scheduled' and p_next_status = 'cancelled')
  ) then
    raise exception 'Invalid ride status transition';
  end if;

  return query
  update public.rides as r
  set status = p_next_status,
      completed_at = case when p_next_status = 'completed' then now() else r.completed_at end
  where r.id = p_ride_id
  returning r.*;
end;
$$;

revoke all on function public.transition_ride(uuid, text) from public;
grant execute on function public.transition_ride(uuid, text) to authenticated;