import type { Ride, RideOption } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session.access_token;
  throw new Error("You’re signed out. Sign in or create an account to continue.");
}

export async function signOut() {
  const { error } = await getSupabaseBrowserClient().auth.signOut();
  if (error) throw error;
}

async function rideRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Ride request failed.");
  return result;
}

export async function loadRides() {
  const result = await rideRequest<{ rides: Ride[]; options: RideOption[] }>("/api/rides");
  return result.rides;
}

export async function createRide(input: {
  pickup: string;
  destination: string;
  optionId: string;
  paymentMethod: Ride["payment"];
  scheduledFor?: string;
}) {
  const result = await rideRequest<{ ride: Ride }>("/api/rides", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.ride;
}

export async function updateRideStatus(id: string, status: "cancelled") {
  const result = await rideRequest<{ ride: Ride }>(`/api/rides/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return result.ride;
}

export type DriverRideRequest = {
  id: string;
  pickup: string;
  destination: string;
  option_id: string;
  status: Ride["status"];
  price: number;
  payment_method: Ride["payment"];
  created_at: string;
};

export async function loadDriverRequests() {
  return rideRequest<{
    rides: DriverRideRequest[];
    assignedRides: DriverRideRequest[];
    setupSql?: string;
  }>("/api/driver/rides");
}

export async function acceptDriverRide(id: string) {
  return rideRequest<{ ride: { id: string; status: Ride["status"] } }>(`/api/driver/rides/${id}`, {
    method: "POST",
  });
}

export async function updateDriverRideStatus(id: string, status: "arriving" | "in_progress" | "completed") {
  return rideRequest<{ ride: { id: string; status: Ride["status"] } }>(`/api/driver/rides/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}