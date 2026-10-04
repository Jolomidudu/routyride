import type { Ride, RideOption } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function formatAuthError(error: unknown) {
  if (!error || typeof error !== "object") return "Could not start a rider session.";

  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  if (message.toLowerCase().includes("anonymous sign-ins are disabled")) {
    return "Anonymous sign-ins are disabled in this Supabase project. Open Authentication → Providers → Anonymous and enable it, then refresh the page.";
  }

  if (message.toLowerCase().includes("email not confirmed") || message.toLowerCase().includes("not authenticated")) {
    return "Supabase auth is not available for this session. Check your project settings and enable the required auth provider.";
  }

  return message || "Could not start a rider session.";
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session.access_token;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(formatAuthError(error));
  }
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
  return rideRequest<{ rides: DriverRideRequest[]; setupSql?: string }>("/api/driver/rides");
}

export async function acceptDriverRide(id: string) {
  return rideRequest<{ ride: { id: string; status: Ride["status"] } }>(`/api/driver/rides/${id}`, {
    method: "POST",
  });
}