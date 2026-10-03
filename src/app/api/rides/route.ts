import { NextResponse } from "next/server";
import { RIDE_OPTIONS, DEMO_DRIVER } from "@/lib/data";

// Simple in-memory store for demo (resets on server restart)
const rides: Array<{
  id: string;
  pickup: string;
  destination: string;
  optionId: string;
  status: string;
  price: number;
  driver?: typeof DEMO_DRIVER;
  createdAt: string;
}> = [];

export async function GET() {
  return NextResponse.json({ rides, options: RIDE_OPTIONS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickup, destination, optionId } = body;

    if (!pickup || !destination || !optionId) {
      return NextResponse.json(
        { error: "pickup, destination and optionId are required" },
        { status: 400 }
      );
    }

    const option = RIDE_OPTIONS.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json({ error: "Invalid ride option" }, { status: 400 });
    }

    const ride = {
      id: `ride_${Date.now()}`,
      pickup,
      destination,
      optionId,
      status: "searching",
      price: option.price,
      createdAt: new Date().toISOString(),
    };

    rides.push(ride);

    // Simulate acceptance after a short delay (in real app this would be async/websocket)
    setTimeout(() => {
      const r = rides.find((x) => x.id === ride.id);
      if (r) {
        r.status = "accepted";
        r.driver = DEMO_DRIVER;
      }
    }, 2000);

    return NextResponse.json({ ride }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
