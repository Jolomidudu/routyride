export type RideOption = {
  id: string;
  name: string;
  price: number;
  eta: string;
  capacity: number;
  description: string;
};

export type Driver = {
  id: string;
  name: string;
  rating: number;
  trips: string;
  car: string;
  plate: string;
  photo: string;
};

export type Ride = {
  id: string;
  status: "searching" | "accepted" | "arriving" | "in_progress" | "completed" | "cancelled";
  pickup: string;
  destination: string;
  option: RideOption;
  driver?: Driver;
  price: number;
  payment: "Cash" | "Card" | "Wallet";
  createdAt: string;
};

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: "economy",
    name: "Economy",
    price: 1500,
    eta: "4 min",
    capacity: 4,
    description: "Affordable everyday rides",
  },
  {
    id: "comfort",
    name: "Comfort",
    price: 2500,
    eta: "6 min",
    capacity: 4,
    description: "Extra space & comfort",
  },
  {
    id: "suv",
    name: "SUV",
    price: 4000,
    eta: "8 min",
    capacity: 6,
    description: "Room for the whole crew",
  },
  {
    id: "premium",
    name: "Premium",
    price: 6000,
    eta: "10 min",
    capacity: 4,
    description: "Top-tier vehicles",
  },
];

export const POPULAR_DESTINATIONS = [
  { id: "airport", name: "Airport", subtitle: "Travel hassle-free", icon: "✈️" },
  { id: "mall", name: "Mall", subtitle: "Shop & relax", icon: "🛍️" },
  { id: "office", name: "Office", subtitle: "Get there on time", icon: "🏢" },
  { id: "home", name: "Home", subtitle: "Back to what matters", icon: "🏠" },
];

export const DEMO_DRIVER: Driver = {
  id: "drv_1",
  name: "Tunde Adesina",
  rating: 4.8,
  trips: "1.2k",
  car: "Toyota Corolla",
  plate: "ABC 123 XY",
  photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tunde",
};

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
