import { NextRequest, NextResponse } from "next/server";
import { getRideRequestClient } from "@/lib/supabase/request";

export async function POST(
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

    const { data: driver, error: driverError } = await client.supabase
      .from("drivers")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (driverError) throw driverError;
    if (!driver) {
      return NextResponse.json({ error: "This account is not enabled as a driver." }, { status: 403 });
    }

    const { id } = await params;
    const { data, error } = await client.supabase.rpc("accept_ride", { p_ride_id: id });
    if (error) {
      if (error.message.includes("no longer available")) {
        return NextResponse.json({ error: "This ride was already accepted or cancelled." }, { status: 409 });
      }
      if (error.message.includes("Driver account not found")) {
        return NextResponse.json({ error: "This account is not enabled as a driver." }, { status: 403 });
      }
      throw error;
    }

    const ride = (Array.isArray(data) ? data[0] : data) as { id: string; status: string } | null;
    if (!ride) return NextResponse.json({ error: "Ride is no longer available." }, { status: 409 });
    return NextResponse.json({ ride: { id: ride.id, status: ride.status } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not accept this ride" }, { status: 500 });
  }
}