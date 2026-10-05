"use client";

import { useEffect, useState } from "react";
import {
  acceptDriverRide,
  loadDriverRequests,
  type DriverRideRequest,
  updateDriverRideStatus,
} from "@/lib/rides-client";
import { formatNaira, RIDE_OPTIONS } from "@/lib/data";

export default function DriverPage() {
  const [rides, setRides] = useState<DriverRideRequest[]>([]);
  const [assignedRides, setAssignedRides] = useState<DriverRideRequest[]>([]);
  const [setupSql, setSetupSql] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    let isCurrent = true;
    const refresh = () => loadDriverRequests()
      .then((result) => {
        if (!isCurrent) return;
        setRides(result.rides);
        setAssignedRides(result.assignedRides ?? []);
        setSetupSql(result.setupSql ?? "");
        setError("");
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : "Could not load available rides.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    refresh();
    const refreshInterval = window.setInterval(refresh, 5000);
    return () => {
      isCurrent = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const handleAccept = async (rideId: string) => {
    setUpdatingId(rideId);
    setError("");
    setNotice("");
    try {
      await acceptDriverRide(rideId);
      const acceptedRide = rides.find((ride) => ride.id === rideId);
      if (acceptedRide) {
        setAssignedRides((current) => [{ ...acceptedRide, status: "accepted" }, ...current]);
      }
      setRides((current) => current.filter((ride) => ride.id !== rideId));
      setNotice("Ride accepted. The rider will see your assignment shortly.");
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Could not accept this ride.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleStatus = async (ride: DriverRideRequest, status: "arriving" | "in_progress" | "completed") => {
    setUpdatingId(ride.id);
    setError("");
    setNotice("");
    try {
      await updateDriverRideStatus(ride.id, status);
      if (status === "completed") {
        setAssignedRides((current) => current.filter((item) => item.id !== ride.id));
        setNotice("Trip completed.");
      } else {
        setAssignedRides((current) => current.map((item) => item.id === ride.id ? { ...item, status } : item));
      }
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update trip status.");
    } finally {
      setUpdatingId("");
    }
  };

  const actionForStatus = (ride: DriverRideRequest) => {
    if (ride.status === "accepted") return { label: "Mark arriving", status: "arriving" as const };
    if (ride.status === "arriving") return { label: "Start trip", status: "in_progress" as const };
    if (ride.status === "in_progress") return { label: "Complete trip", status: "completed" as const };
    return null;
  };

  return (
    <main className="min-h-dvh bg-[#f3f3f3] text-slate-900">
      <div className="mx-auto min-h-dvh w-full max-w-[920px] bg-white px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Routyride</p>
            <h1 className="mt-1 text-2xl font-bold">Driver requests</h1>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/auth?next=/driver" className="text-sm font-semibold text-slate-700 underline underline-offset-4">Account</a>
            <a href="/ride" className="text-sm font-semibold text-slate-700 underline underline-offset-4">Rider app</a>
          </nav>
        </header>

        {error && (
          <div role="alert" className="mt-5 flex items-start justify-between gap-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            {error.toLowerCase().includes("signed out") && <a href="/auth?next=/driver" className="shrink-0 font-semibold underline">Sign in</a>}
          </div>
        )}
        {notice && <p role="status" className="mt-5 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        {setupSql ? (
          <section className="mt-8 max-w-2xl">
            <h2 className="text-lg font-semibold">Enable this account as a driver</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Run this statement in your Supabase SQL Editor. It provisions only the account currently signed in here.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs leading-6 text-slate-100">{setupSql}</pre>
            <p className="mt-3 text-sm text-slate-500">Refresh this page after the insert succeeds.</p>
          </section>
        ) : (
          <section className="mt-7">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Your active trips</h2>
              <p className="mt-1 text-sm text-slate-500">Update the trip as it progresses</p>
            </div>
            {assignedRides.length === 0 ? (
              <p className="border-y border-slate-200 py-5 text-sm text-slate-500">No active trips assigned.</p>
            ) : (
              <ul className="mb-8 divide-y divide-slate-200 border-y border-slate-200">
                {assignedRides.map((ride) => {
                  const option = RIDE_OPTIONS.find((item) => item.id === ride.option_id);
                  const action = actionForStatus(ride);
                  return (
                    <li key={ride.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-slate-500">{ride.status.replace("_", " ")}</p>
                        <p className="mt-2 truncate text-sm font-semibold">{ride.pickup}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">To {ride.destination}</p>
                        <p className="mt-2 text-xs text-slate-500">{option?.name ?? ride.option_id} · {formatNaira(ride.price)}</p>
                      </div>
                      {action && (
                        <button
                          onClick={() => handleStatus(ride, action.status)}
                          disabled={updatingId !== ""}
                          className="shrink-0 rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-400"
                        >
                          {updatingId === ride.id ? "Updating..." : action.label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Available now</h2>
                <p className="mt-1 text-sm text-slate-500">Open rider requests, oldest first</p>
              </div>
              <span className="text-sm tabular-nums text-slate-500">{rides.length} requests</span>
            </div>

            {isLoading ? (
              <p className="border-y border-slate-200 py-8 text-center text-sm text-slate-500">Loading requests...</p>
            ) : rides.length === 0 ? (
              <p className="border-y border-slate-200 py-8 text-center text-sm text-slate-500">No open requests right now.</p>
            ) : (
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {rides.map((ride) => {
                  const option = RIDE_OPTIONS.find((item) => item.id === ride.option_id);
                  return (
                    <li key={ride.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">{new Date(ride.created_at).toLocaleString()}</p>
                        <p className="mt-2 truncate text-sm font-semibold">{ride.pickup}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">To {ride.destination}</p>
                        <p className="mt-2 text-xs text-slate-500">{option?.name ?? ride.option_id} · {ride.payment_method}</p>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
                        <span className="font-semibold tabular-nums">{formatNaira(ride.price)}</span>
                        <button
                          onClick={() => handleAccept(ride.id)}
                          disabled={updatingId !== ""}
                          className="rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-400"
                        >
                          {updatingId === ride.id ? "Accepting..." : "Accept ride"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}