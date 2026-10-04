# Routyride

Fast, safe and reliable rides — your ride, your way.

A fullstack ride-hailing web app inspired by Uber/Bolt, built with **Next.js 16**, **React 19**, **TypeScript** and **Tailwind CSS 4**.

## Current scope

- `/` and `/ride` open the same booking app.
- Riders get a persistent anonymous Supabase session in this browser.
- Ride requests, scheduled bookings, cancellations, completions, and ride history are stored in Supabase.
- Ride rows are scoped to their rider with row-level security. Fares are selected server-side from the ride catalog.
- Driver matching and map visuals are still demonstrations. There is no driver app or live map integration yet.

## Supabase setup

1. Create a Supabase project and enable anonymous sign-ins under **Authentication → Providers → Anonymous**.
2. Run [`supabase/migrations/20261004000000_create_rides.sql`](supabase/migrations/20261004000000_create_rides.sql) in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and set the project URL and anon/publishable key from **Project Settings → API**.
4. Restart the Next.js dev server after setting environment variables.

The app intentionally uses only the public anon key. Do not put a service-role key in a `NEXT_PUBLIC_` variable or commit it.

## Run locally

```bash
cd routyride
npm install
npm run dev
```

- Landing: http://localhost:3000  
- App: http://localhost:3000/ride  

## Next steps for production

- Replace anonymous sessions with verified rider and driver accounts.
- Add driver availability, dispatch, and live trip updates.
- Integrate geocoding, routing, and driver location tracking.
- Add real payment processing and operational support tooling.
