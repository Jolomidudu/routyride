import type { Ride, RideOption } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session.access_token;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error("Could not start a rider session.");
  return data.session.access_token;
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

export async function updateRideStatus(id: string, status: "arriving" | "completed" | "cancelled") {
  const result = await rideRequest<{ ride: Ride }>(`/api/rides/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return result.ride;
}