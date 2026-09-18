"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RIDE_OPTIONS,
  POPULAR_DESTINATIONS,
  DEMO_DRIVER,
  DEMO_USER,
  SAMPLE_HISTORY,
  formatNaira,
  formatDate,
  formatTime,
  type RideOption,
  type Ride,
  type User,
} from "@/lib/data";

type Tab = "home" | "activity" | "wallet" | "profile";
type Flow = "idle" | "select" | "searching" | "active" | "completed";

export default function RideAppPage() {
  const [tab, setTab] = useState<Tab>("home");
  const [flow, setFlow] = useState<Flow>("idle");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedOption, setSelectedOption] = useState<RideOption | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [history, setHistory] = useState<Ride[]>(SAMPLE_HISTORY);
  const [user, setUser] = useState<User>(DEMO_USER);
  const [searchProgress, setSearchProgress] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Wallet">("Cash");

  // Simulate searching for driver
  useEffect(() => {
    if (flow !== "searching") return;
    setSearchProgress(0);
    const interval = setInterval(() => {
      setSearchProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const ride: Ride = {
            id: `ride_${Date.now()}`,
            status: "arriving",
            pickup: pickup || "123 Allen Avenue, Ikeja",
            destination: destination || "Victoria Island, Lagos",
            option: selectedOption!,
            driver: DEMO_DRIVER,
            price: selectedOption!.price,
            payment: paymentMethod,
            createdAt: new Date().toISOString(),
          };
          setActiveRide(ride);
          setFlow("active");
          return 100;
        }
        return p + 8;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [flow, pickup, destination, selectedOption, paymentMethod]);

  const handleRequestRide = () => {
    if (!selectedOption) return;
    setFlow("searching");
  };

  const handleCancel = () => {
    setActiveRide(null);
    setSelectedOption(null);
    setFlow("idle");
    setSearchProgress(0);
  };

  const handleComplete = () => {
    if (activeRide) {
      const completed: Ride = {
        ...activeRide,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      setHistory((prev) => [completed, ...prev]);
      if (paymentMethod === "Wallet") {
        setUser((u) => ({
          ...u,
          walletBalance: Math.max(0, u.walletBalance - activeRide.price),
        }));
      }
      setActiveRide(completed);
    }
    setFlow("completed");
  };

  const handleDone = () => {
    setActiveRide(null);
    setSelectedOption(null);
    setPickup("");
    setDestination("");
    setFlow("idle");
    setTab("home");
  };

  // When in a booking flow, hide bottom tabs except cancel paths
  const showTabs = flow === "idle" || flow === "completed";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-full max-w-[390px] bg-slate-900 rounded-[2.75rem] p-3 shadow-2xl shadow-slate-900/40 border-[7px] border-slate-800">
        <div className="bg-white rounded-[2.2rem] overflow-hidden h-[780px] flex flex-col relative">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3.5 pb-1 text-[12px] font-semibold text-slate-900 shrink-0">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3C7.5 3 3.7 5.1 1.5 8.2L12 21l10.5-12.8C20.3 5.1 16.5 3 12 3z" opacity=".3" />
                <path d="M12 3C7.5 3 3.7 5.1 1.5 8.2L12 21l10.5-12.8C20.3 5.1 16.5 3 12 3zm0 2c3.3 0 6.2 1.4 8.1 3.6L12 17.5 3.9 8.6C5.8 6.4 8.7 5 12 5z" />
              </svg>
              <div className="w-6 h-3 border-[1.5px] border-slate-900 rounded-[3px] relative">
                <div className="absolute inset-[2px] bg-slate-900 rounded-[1px] w-[70%]" />
              </div>
            </div>
          </div>

          {/* Content */}
          {flow === "idle" && tab === "home" && (
            <HomeScreen
              pickup={pickup}
              setPickup={setPickup}
              destination={destination}
              setDestination={setDestination}
              onContinue={() => setFlow("select")}
            />
          )}
          {flow === "idle" && tab === "activity" && (
            <ActivityScreen history={history} />
          )}
          {flow === "idle" && tab === "wallet" && (
            <WalletScreen
              user={user}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          )}
          {flow === "idle" && tab === "profile" && (
            <ProfileScreen user={user} />
          )}

          {flow === "select" && (
            <SelectScreen
              pickup={pickup}
              destination={destination}
              selected={selectedOption}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onSelect={setSelectedOption}
              onBack={() => setFlow("idle")}
              onRequest={handleRequestRide}
            />
          )}
          {flow === "searching" && (
            <SearchingScreen progress={searchProgress} onCancel={handleCancel} />
          )}
          {flow === "active" && activeRide && (
            <ActiveRideScreen
              ride={activeRide}
              onCancel={handleCancel}
              onComplete={handleComplete}
            />
          )}
          {flow === "completed" && activeRide && (
            <CompletedScreen ride={activeRide} onDone={handleDone} />
          )}

          {/* Bottom nav */}
          {showTabs && (
            <BottomNav active={tab} onChange={setTab} />
          )}
        </div>
      </div>

      {/* Desktop helper */}
      <div className="hidden lg:flex flex-col gap-2 fixed bottom-6 left-6 text-sm">
        <Link
          href="/"
          className="text-green-600 font-medium hover:underline bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow"
        >
          ← Back to landing
        </Link>
        <p className="text-slate-500 bg-white/80 px-3 py-1 rounded-full text-xs">
          Tip: complete a ride → check Activity & Wallet
        </p>
      </div>
    </div>
  );
}

/* ───────────── Home ───────────── */
function HomeScreen({
  pickup,
  setPickup,
  destination,
  setDestination,
  onContinue,
}: {
  pickup: string;
  setPickup: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span className="font-bold text-[15px] text-slate-900">
            Routy<span className="text-green-600">ride</span>
          </span>
        </div>
        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center relative">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
        <div>
          <p className="text-sm text-slate-500">Good evening,</p>
          <h1 className="text-xl font-bold text-slate-900">Where are you going?</h1>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 ring-4 ring-green-100 shrink-0" />
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Enter pickup location"
              className="flex-1 bg-transparent text-[15px] outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <div className="ml-[7px] border-l-2 border-dashed border-slate-200 h-3" />
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-sm bg-red-500 ring-4 ring-red-100 shrink-0" />
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination"
              className="flex-1 bg-transparent text-[15px] outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
          <div className="relative z-10 max-w-[60%]">
            <p className="text-xs font-medium text-green-400">Ride smarter</p>
            <p className="text-base font-bold leading-tight mt-0.5">with Routyride.</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Comfort, safety and convenience — always.
            </p>
            <button
              onClick={onContinue}
              className="mt-3 bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-full transition"
            >
              Book a Ride →
            </button>
          </div>
          <div className="absolute right-2 bottom-2 w-28 opacity-90">
            <CarIllustration />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[15px] font-bold text-slate-900">Choose a Ride</h2>
            <button onClick={onContinue} className="text-xs text-green-600 font-semibold">
              See all
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {RIDE_OPTIONS.map((ride) => (
              <button
                key={ride.id}
                onClick={() => {
                  if (!pickup) setPickup("Current location");
                  if (!destination) setDestination("Victoria Island, Lagos");
                  onContinue();
                }}
                className="bg-slate-50 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-xl p-2.5 text-center transition"
              >
                <div className="w-10 h-6 mx-auto mb-1.5 bg-gradient-to-b from-slate-200 to-slate-300 rounded-md" />
                <p className="text-[11px] font-semibold text-slate-800">{ride.name}</p>
                <p className="text-[11px] font-bold text-slate-900">{formatNaira(ride.price)}</p>
                <p className="text-[10px] text-slate-500">{ride.eta}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[15px] font-bold text-slate-900">Popular Destinations</h2>
            <span className="text-xs text-green-600 font-semibold">See all</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {POPULAR_DESTINATIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDestination(d.name);
                  if (!pickup) setPickup("Current location");
                  onContinue();
                }}
                className="bg-slate-50 hover:bg-slate-100 rounded-xl p-2.5 text-center transition"
              >
                <div className="text-xl mb-1">{d.icon}</div>
                <p className="text-[11px] font-semibold text-slate-800">{d.name}</p>
                <p className="text-[9px] text-slate-500 leading-tight">{d.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── Select Ride ───────────── */
function SelectScreen({
  pickup,
  destination,
  selected,
  paymentMethod,
  setPaymentMethod,
  onSelect,
  onBack,
  onRequest,
}: {
  pickup: string;
  destination: string;
  selected: RideOption | null;
  paymentMethod: "Cash" | "Card" | "Wallet";
  setPaymentMethod: (m: "Cash" | "Card" | "Wallet") => void;
  onSelect: (o: RideOption) => void;
  onBack: () => void;
  onRequest: () => void;
}) {
  return (
    <>
      <div className="px-4 pt-2 pb-3 flex items-center gap-3 shrink-0 border-b border-slate-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">{pickup || "Pickup"}</p>
          <p className="text-sm font-semibold text-slate-900 truncate">{destination || "Destination"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Choose your ride</h2>
        {RIDE_OPTIONS.map((opt) => {
          const isSelected = selected?.id === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${
                isSelected
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className="w-14 h-10 bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shrink-0">
                <CarIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">{opt.name}</p>
                  <p className="font-bold text-slate-900">{formatNaira(opt.price)}</p>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {opt.eta} · {opt.capacity} seats · {opt.description}
                </p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}

        {/* Payment method */}
        <div className="pt-2">
          <p className="text-sm font-semibold text-slate-700 mb-2">Payment method</p>
          <div className="flex gap-2">
            {(["Cash", "Card", "Wallet"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                  paymentMethod === m
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-100 text-slate-600 hover:border-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={onRequest}
          disabled={!selected}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-green-600/20"
        >
          {selected ? `Request ${selected.name} · ${formatNaira(selected.price)}` : "Select a ride"}
        </button>
      </div>
    </>
  );
}

/* ───────────── Searching ───────────── */
function SearchingScreen({ progress, onCancel }: { progress: number; onCancel: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-green-100" />
        <div
          className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"
          style={{ animationDuration: "0.9s" }}
        />
        <div className="absolute inset-4 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h5m1 6l-3-3m0 0l-3 3m3-3v6" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Finding your ride...</h2>
      <p className="text-sm text-slate-500 mb-6">Matching you with a nearby driver</p>
      <div className="w-full max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <button onClick={onCancel} className="text-sm font-semibold text-red-500 hover:text-red-600">
        Cancel request
      </button>
    </div>
  );
}

/* ───────────── Active Ride ───────────── */
function ActiveRideScreen({
  ride,
  onCancel,
  onComplete,
}: {
  ride: Ride;
  onCancel: () => void;
  onComplete: () => void;
}) {
  return (
    <>
      <div className="relative h-[300px] bg-gradient-to-b from-emerald-50 to-slate-100 shrink-0">
        <div className="absolute inset-0 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">
            <line x1="0" y1="80" x2="400" y2="80" stroke="#94a3b8" strokeWidth="8" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="6" />
            <line x1="0" y1="240" x2="400" y2="240" stroke="#94a3b8" strokeWidth="5" />
            <line x1="80" y1="0" x2="80" y2="320" stroke="#94a3b8" strokeWidth="6" />
            <line x1="200" y1="0" x2="200" y2="320" stroke="#94a3b8" strokeWidth="8" />
            <line x1="320" y1="0" x2="320" y2="320" stroke="#94a3b8" strokeWidth="5" />
            <path d="M 100 250 Q 150 180 200 140 T 300 80" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-white/95 backdrop-blur shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-slate-900">You&apos;re on your way</p>
              <p className="text-xs text-slate-500">Arriving in 6 min</p>
            </div>
          </div>
        </div>
        <div className="absolute left-[22%] bottom-[28%]">
          <div className="w-8 h-8 rounded-full bg-green-600 border-4 border-white shadow-md" />
        </div>
        <div className="absolute right-[22%] top-[18%]">
          <div className="w-8 h-8 rounded-full bg-red-500 border-4 border-white shadow-md" />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2" />
        <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-50">
          <img
            src={ride.driver?.photo}
            alt={ride.driver?.name}
            className="w-14 h-14 rounded-full bg-slate-100 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">{ride.driver?.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-amber-500">★</span>
              <span className="font-medium text-slate-700">{ride.driver?.rating}</span>
              <span>({ride.driver?.trips})</span>
              <span>·</span>
              <span>{ride.driver?.car}</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{ride.driver?.plate}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 space-y-2.5 flex-1">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Pickup</p>
              <p className="text-sm font-medium text-slate-900">{ride.pickup}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-sm bg-red-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Destination</p>
              <p className="text-sm font-medium text-slate-900">{ride.destination}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {ride.payment}
              </span>
            </div>
            <button className="text-sm font-semibold text-green-600">Share Ride</button>
          </div>
        </div>

        <div className="p-4 space-y-2 shrink-0">
          <button
            onClick={onComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition"
          >
            I&apos;ve arrived
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-white border-2 border-red-200 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 transition"
          >
            Cancel Ride
          </button>
        </div>
      </div>
    </>
  );
}

/* ───────────── Completed ───────────── */
function CompletedScreen({ ride, onDone }: { ride: Ride; onDone: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Ride completed!</h2>
      <p className="text-slate-500 mb-6">Thanks for riding with Routyride</p>
      <div className="w-full bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Trip</span>
          <span className="font-medium text-slate-900">{ride.option.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Driver</span>
          <span className="font-medium text-slate-900">{ride.driver?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Payment</span>
          <span className="font-medium text-slate-900">{ride.payment}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
          <span className="text-slate-500">Total</span>
          <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
        </div>
      </div>
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} className="text-2xl text-amber-400 hover:scale-110 transition">
            ★
          </button>
        ))}
      </div>
      <button
        onClick={onDone}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition"
      >
        Done
      </button>
    </div>
  );
}

/* ───────────── Activity ───────────── */
function ActivityScreen({ history }: { history: Ride[] }) {
  return (
    <>
      <div className="px-5 pt-3 pb-3 shrink-0">
        <h1 className="text-xl font-bold text-slate-900">Activity</h1>
        <p className="text-sm text-slate-500">Your past rides</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">No rides yet</p>
            <p className="text-xs mt-1">Book your first ride to see it here</p>
          </div>
        ) : (
          history.map((ride) => (
            <div
              key={ride.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {ride.pickup} → {ride.destination}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(ride.createdAt)} · {formatTime(ride.createdAt)}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {ride.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium">{ride.option.name}</span>
                  <span className="text-slate-300">·</span>
                  <span>{ride.driver?.name || "—"}</span>
                </div>
                <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ───────────── Wallet ───────────── */
function WalletScreen({
  user,
  paymentMethod,
  setPaymentMethod,
}: {
  user: User;
  paymentMethod: "Cash" | "Card" | "Wallet";
  setPaymentMethod: (m: "Cash" | "Card" | "Wallet") => void;
}) {
  return (
    <>
      <div className="px-5 pt-3 pb-3 shrink-0">
        <h1 className="text-xl font-bold text-slate-900">Wallet</h1>
        <p className="text-sm text-slate-500">Manage payments</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm text-green-100">Available balance</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{formatNaira(user.walletBalance)}</p>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold py-2.5 rounded-xl transition">
              Top up
            </button>
            <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold py-2.5 rounded-xl transition">
              Withdraw
            </button>
          </div>
        </div>

        {/* Default payment */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Default payment method</p>
          <div className="space-y-2">
            {(["Cash", "Card", "Wallet"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${
                  paymentMethod === m
                    ? "border-green-500 bg-green-50"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === m ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m === "Cash" && "💵"}
                  {m === "Card" && "💳"}
                  {m === "Wallet" && "📱"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{m}</p>
                  <p className="text-xs text-slate-500">
                    {m === "Cash" && "Pay the driver directly"}
                    {m === "Card" && "Visa ···· 4242"}
                    {m === "Wallet" && `Balance ${formatNaira(user.walletBalance)}`}
                  </p>
                </div>
                {paymentMethod === m && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── Profile ───────────── */
function ProfileScreen({ user }: { user: User }) {
  return (
    <>
      <div className="px-5 pt-3 pb-3 shrink-0">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col items-center py-4">
          <img
            src={user.photo}
            alt={user.name}
            className="w-24 h-24 rounded-full bg-slate-100 object-cover border-4 border-green-100"
          />
          <h2 className="text-lg font-bold text-slate-900 mt-3">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          <p className="text-sm text-slate-500">{user.phone}</p>
        </div>

        <div className="space-y-1 mt-2">
          {[
            { label: "Personal info", icon: "👤" },
            { label: "Saved places", icon: "📍" },
            { label: "Safety", icon: "🛡️" },
            { label: "Promotions", icon: "🎁" },
            { label: "Help & support", icon: "💬" },
            { label: "Settings", icon: "⚙️" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition text-left"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 font-medium text-slate-800">{item.label}</span>
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button className="w-full mt-6 py-3 text-red-500 font-semibold text-sm hover:bg-red-50 rounded-xl transition">
          Log out
        </button>
      </div>
    </>
  );
}

/* ───────────── Bottom Nav ───────────── */
function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "activity", label: "Activity" },
    { id: "wallet", label: "Wallet" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className="border-t border-slate-100 px-2 py-2.5 flex justify-around shrink-0 bg-white">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 min-w-[64px] py-1 transition ${
              isActive ? "text-green-600" : "text-slate-400"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isActive ? "bg-green-100" : ""
              }`}
            >
              {tab.id === "home" && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              )}
              {tab.id === "activity" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {tab.id === "wallet" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              {tab.id === "profile" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Icons ───────────── */
function CarIcon() {
  return (
    <svg viewBox="0 0 40 24" className="w-10 h-6">
      <rect x="4" y="10" width="32" height="9" rx="2" fill="#cbd5e1" />
      <path d="M10 10 L14 4 H26 L30 10" fill="#e2e8f0" />
      <circle cx="12" cy="20" r="3.5" fill="#1e293b" />
      <circle cx="28" cy="20" r="3.5" fill="#1e293b" />
      <rect x="16" y="6" width="8" height="5" rx="0.5" fill="#bbf7d0" />
    </svg>
  );
}

function CarIllustration() {
  return (
    <svg viewBox="0 0 120 60" className="w-full h-auto">
      <rect x="15" y="22" width="90" height="20" rx="4" fill="#f8fafc" stroke="#22c55e" strokeWidth="1.5" />
      <path d="M25 22 L35 10 H75 L90 22" fill="#e2e8f0" stroke="#22c55e" strokeWidth="1.2" />
      <circle cx="35" cy="44" r="7" fill="#0f172a" />
      <circle cx="85" cy="44" r="7" fill="#0f172a" />
      <circle cx="35" cy="44" r="2.5" fill="#94a3b8" />
      <circle cx="85" cy="44" r="2.5" fill="#94a3b8" />
      <rect x="42" y="13" width="28" height="10" rx="1" fill="#86efac" />
      <text x="56" y="34" textAnchor="middle" fontSize="6" fill="#16a34a" fontWeight="700">
        Routyride
      </text>
    </svg>
  );
}
