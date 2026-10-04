import { NextRequest, NextResponse } from "next/server";
import { getRideRequestClient } from "@/lib/supabase/request";

async function authenticateDriver(request: NextRequest) {
  const client = getRideRequestClient(request);
  if (!client) return { response: NextResponse.json({ error: "Sign-in required" }, { status: 401 }) };

  const { data: authData, error: authError } = await client.supabase.auth.getUser(client.accessToken);
  if (authError || !authData.user) {
    return { response: NextResponse.json({ error: "Session expired. Please retry." }, { status: 401 }) };
  }

  const { data: driver, error } = await client.supabase
    .from("drivers")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) throw error;
  return { ...client, userId: authData.user.id, driver: Boolean(driver) };
}

export async function GET(request: NextRequest) {
  try {
    const client = await authenticateDriver(request);
    if ("response" in client) return client.response;
    if (!client.driver) {
      return NextResponse.json({
        rides: [],
        setupSql: `insert into public.drivers (user_id, name, car, plate) values ('${client.userId}', 'Driver Name', 'Toyota Corolla', 'ABC 123 XY');`,
      });
    }

    const { data, error } = await client.supabase
      .from("rides")
      .select("id, pickup, destination, option_id, status, price, payment_method, created_at")
      .eq("status", "searching")
      .is("assigned_driver_id", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;

    return NextResponse.json({ rides: data });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not load available rides" }, { status: 500 });
  }
}