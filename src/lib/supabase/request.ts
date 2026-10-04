import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export function getRideRequestClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Add the project URL and anon key to .env.local.");
  }
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { supabase, accessToken: authorization.slice("Bearer ".length) };
}