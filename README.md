# Routyride

Fast, safe and reliable rides — your ride, your way.

A fullstack ride-hailing web app inspired by Uber/Bolt, built with **Next.js 16**, **React 19**, **TypeScript** and **Tailwind CSS 4**.

## Features

### Landing page (`/`)
- Brand hero matching the design
- Request a Ride / Book for Later CTAs
- Feature highlights + phone mockup

### Ride app (`/ride`)
- **Home** — pickup/destination, ride options, popular destinations
- **Choose ride** — Economy / Comfort / SUV / Premium + payment method (Cash / Card / Wallet)
- **Searching** — animated driver matching
- **Active ride** — map, driver card (Tunde Adesina), cancel / complete
- **Completed** — summary + star rating
- **Activity** — ride history (updates when you complete a ride)
- **Wallet** — balance, top-up, default payment method
- **Profile** — user info + settings menu
- Working bottom navigation

### API
- `GET/POST /api/rides` — list options & create rides

## Run locally

```bash
cd routyride
npm install
npm run dev
```

- Landing: http://localhost:3000  
- App: http://localhost:3000/ride  

## Demo tips

1. Open `/ride`
2. Enter locations (or tap a ride option / popular destination)
3. Select a ride + payment method → Request
4. Wait for driver match → Active ride screen
5. Tap "I've arrived" → rate → Done
6. Check **Activity** (history updated) and **Wallet** (balance drops if you paid with Wallet)

## Next steps for production

- Auth (NextAuth / Clerk)
- Database (Prisma + Postgres)
- Real maps (Mapbox / Google Maps)
- Payments (Paystack / Flutterwave)
- WebSockets for live tracking
- Driver + rider roles
