import { NextRequest, NextResponse } from "next/server";
import { RIDE_OPTIONS, type Ride } from "@/lib/data";
import { getRideRequestClient } from "@/lib/supabase/request";

type RideRow = {
  id: string;
  pickup: string;
  destination: string;
  option_id: string;
  status: Ride["status"];
  price: number;
  payment_method: Ride["payment"];
  created_at: string;
  scheduled_for: string | null;
  completed_at: string | null;
  driver?: {
    name: string;
    rating: number;
    trips: number;
    car: string;
    plate: string;
  } | null;
};

function toRide(row: RideRow): Ride | null {
  const option = RIDE_OPTIONS.find((item) => item.id === row.option_id);
  if (!option) return null;

  return {
    id: row.id,
    status: row.status,
    pickup: row.pickup,
    destination: row.destination,
    option,
    price: row.price,
    payment: row.payment_method,
    createdAt: row.created_at,
    scheduledFor: row.scheduled_for ?? undefined,
    completedAt: row.completed_at ?? undefined,
    driver: row.driver ? {
      id: "assigned-driver",
      name: row.driver.name,
      rating: row.driver.rating,
      trips: row.driver.trips.toLocaleString("en-NG"),
      car: row.driver.car,
      plate: row.driver.plate,
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.driver.name)}`,
    } : undefined,
  };
}

async function authenticate(request: NextRequest) {
  const client = getRideRequestClient(request);
  if (!client) return { response: NextResponse.json({ error: "Sign-in required" }, { status: 401 }) };

  const { data, error } = await client.supabase.auth.getUser(client.accessToken);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Session expired. Please retry." }, { status: 401 }) };
  }

  return { ...client, userId: data.user.id };
}

function configurationError(error: unknown) {
  if (error instanceof Error && error.message.includes("not configured")) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase
      .from("rides")
      .select("id, pickup, destination, option_id, status, price, payment_method, created_at, scheduled_for, completed_at, driver:drivers!rides_assigned_driver_id_fkey(name, rating, trips, car, plate)")
      .eq("rider_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    const rides = (data as unknown as RideRow[]).map(toRide).filter((ride): ride is Ride => ride !== null);
    return NextResponse.json({ rides, options: RIDE_OPTIONS });
  } catch (error) {
    return configurationError(error) ?? NextResponse.json({ error: "Could not load rides" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if ("response" in auth) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid ride request" }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid ride request" }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const pickup = typeof input.pickup === "string" ? input.pickup.trim() : "";
    const destination = typeof input.destination === "string" ? input.destination.trim() : "";
    const option = RIDE_OPTIONS.find((item) => item.id === input.optionId);
    const payment = input.paymentMethod;
    const scheduledFor = input.scheduledFor;

    if (!pickup || pickup.length > 200 || !destination || destination.length > 200 || !option) {
      return NextResponse.json({ error: "Enter valid pickup, destination and ride option" }, { status: 400 });
    }
    if (payment !== "Cash" && payment !== "Card" && payment !== "Wallet") {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    if (scheduledFor !== undefined && (typeof scheduledFor !== "string" || Number.isNaN(Date.parse(scheduledFor)))) {
      return NextResponse.json({ error: "Invalid scheduled time" }, { status: 400 });
    }
    if (typeof scheduledFor === "string" && Date.parse(scheduledFor) <= Date.now()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    const status: Ride["status"] = scheduledFor ? "scheduled" : "searching";
    const { data, error } = await auth.supabase
      .from("rides")
      .insert({
        rider_id: auth.userId,
        pickup,
        destination,
        option_id: option.id,
        price: option.price,
        payment_method: payment,
        status,
        scheduled_for: scheduledFor ?? null,
      })
      .select("id, pickup, destination, option_id, status, price, payment_method, created_at, scheduled_for, completed_at")
      .single();

    if (error) throw error;
    const ride = toRide(data as RideRow);
    if (!ride) throw new Error("Created ride has an unknown option");
    return NextResponse.json({ ride }, { status: 201 });
  } catch (error) {
    return configurationError(error) ?? NextResponse.json({ error: "Could not create ride" }, { status: 500 });
  }
}
