# Routyride

Fast, safe and reliable rides — your ride, your way.

A fullstack ride-hailing web app inspired by Uber/Bolt, built with **Next.js 16**, **React 19**, **TypeScript** and **Tailwind CSS 4**.

## Features

- Beautiful landing page matching the brand design
- Interactive mobile-first ride booking flow:
  - Enter pickup & destination
  - Choose Economy / Comfort / SUV / Premium
  - Simulated driver matching
  - Live ride screen with map, driver info, cancel & complete
- API routes for rides (`/api/rides`)
- Nigerian Naira pricing & Lagos locations (demo data)

## Getting Started

```bash
cd routyride
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- Landing page: `/`
- Ride app: `/ride`

## Project Structure

```
src/
  app/
    page.tsx          # Landing page
    ride/page.tsx     # Interactive ride booking UI
    api/rides/        # REST API for rides
    layout.tsx
    globals.css
  lib/
    data.ts           # Shared types & mock data
```

## Tech Stack

- Next.js App Router
- Tailwind CSS v4
- TypeScript
- Client-side state for the booking demo + simple API routes

## Next Steps (production ideas)

- Real auth (NextAuth / Clerk)
- Database (Prisma + Postgres)
- Real-time updates (WebSockets / Pusher)
- Maps (Mapbox / Google Maps)
- Payments (Paystack / Flutterwave)
- Driver & rider roles
