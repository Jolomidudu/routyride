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
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const client = getRideRequestClient(request);
    if (!client) return NextResponse.json({ error: "Sign-in required" }, { status: 401 });

    const { data: authData, error: authError } = await client.supabase.auth.getUser(client.accessToken);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Session expired. Please retry." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid ride update" }, { status: 400 });
    }
    const status = body && typeof body === "object" ? (body as Record<string, unknown>).status : null;
    if (status !== "arriving" && status !== "completed" && status !== "cancelled") {
      return NextResponse.json({ error: "Invalid ride status" }, { status: 400 });
    }

    const { id } = await params;
    const { data, error } = await client.supabase.rpc("transition_ride", {
      p_ride_id: id,
      p_next_status: status,
    });
    if (error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 });
      }
      if (error.message.includes("Invalid ride status transition")) {
        return NextResponse.json({ error: "Ride cannot move to that status" }, { status: 409 });
      }
      throw error;
    }

    const row = (Array.isArray(data) ? data[0] : data) as RideRow | null;
    const ride = row && toRide(row);
    if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    return NextResponse.json({ ride });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not update ride" }, { status: 500 });
  }
}