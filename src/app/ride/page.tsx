"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RIDE_OPTIONS,
  POPULAR_DESTINATIONS,
  DEMO_USER,
  formatNaira,
  formatDate,
  formatTime,
  formatDateTime,
  type RideOption,
  type Ride,
  type User,
} from "@/lib/data";
import { createRide, loadRides, updateRideStatus } from "@/lib/rides-client";

type Tab = "home" | "activity" | "wallet" | "profile";
type Flow =
  | "idle"
  | "select"
  | "schedule"
  | "searching"
  | "active"
  | "completed"
  | "scheduled_confirm";

export default function RideAppPage() {
  const [tab, setTab] = useState<Tab>("home");
  const [flow, setFlow] = useState<Flow>("idle");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedOption, setSelectedOption] = useState<RideOption | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [history, setHistory] = useState<Ride[]>([]);
  const [user, setUser] = useState<User>(DEMO_USER);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Wallet">("Cash");
  const [isSchedule, setIsSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const refreshRides = () => loadRides()
      .then((rides) => {
        if (!isCurrent) return;
        setHistory(rides);

        const currentRide = rides.find((ride) => ride.status === "searching" || ride.status === "accepted" || ride.status === "arriving");
        if (!currentRide) return;

        setActiveRide(currentRide);
        setSelectedOption(currentRide.option);
        setPickup(currentRide.pickup);
        setDestination(currentRide.destination);
        setPaymentMethod(currentRide.payment);
        setFlow(currentRide.status === "searching" ? "searching" : "active");
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setApiError(error instanceof Error ? error.message : "Could not load your rides.");
        }
      });
    refreshRides();
    const refreshInterval = window.setInterval(refreshRides, 4000);

    return () => {
      isCurrent = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const scheduledISO = useMemo(() => {
    if (!scheduleDate || !scheduleTime) return "";
    return new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
  }, [scheduleDate, scheduleTime]);

  const handleRequestRide = async () => {
    if (!selectedOption) return;
    if (isSchedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate((current) => current || tomorrow.toISOString().slice(0, 10));
      setFlow("schedule");
      return;
    }
    setApiError("");
    setIsSubmitting(true);
    try {
      const ride = await createRide({
        pickup,
        destination,
        optionId: selectedOption.id,
        paymentMethod,
      });
      setActiveRide(ride);
      setHistory((current) => [ride, ...current]);
      setFlow("searching");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not request a ride.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!selectedOption || !scheduledISO) return;
    setApiError("");
    setIsSubmitting(true);
    try {
      const ride = await createRide({
        pickup,
        destination,
        optionId: selectedOption.id,
        paymentMethod,
        scheduledFor: scheduledISO,
      });
      setHistory((current) => [ride, ...current]);
      setActiveRide(ride);
      setFlow("scheduled_confirm");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not schedule this ride.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const previousFlow = flow;
    setFlow("idle");
    setIsSubmitting(true);
    if (activeRide) {
      setApiError("");
      try {
        const ride = await updateRideStatus(activeRide.id, "cancelled");
        setHistory((current) => [ride, ...current.filter((item) => item.id !== ride.id)]);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Could not cancel this ride.");
        setFlow(previousFlow);
        setIsSubmitting(false);
        return;
      }
    }
    setActiveRide(null);
    setSelectedOption(null);
    setFlow("idle");
    setIsSchedule(false);
    setIsSubmitting(false);
  };

  const handleComplete = async () => {
    if (activeRide) {
      setApiError("");
      setIsSubmitting(true);
      try {
        const completed = await updateRideStatus(activeRide.id, "completed");
        setHistory((current) => [completed, ...current.filter((ride) => ride.id !== completed.id)]);
        if (paymentMethod === "Wallet") {
          setUser((current) => ({
            ...current,
            walletBalance: Math.max(0, current.walletBalance - activeRide.price),
          }));
        }
        setActiveRide({ ...completed, driver: activeRide.driver });
        setFlow("completed");
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Could not complete this ride.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDone = () => {
    setActiveRide(null);
    setSelectedOption(null);
    setPickup("");
    setDestination("");
    setFlow("idle");
    setIsSchedule(false);
    setTab("home");
    setApiError("");
  };

  const showTabs = flow === "idle";

  return (
    <div className="min-h-dvh bg-[#f3f3f3] flex justify-center">
      <div className="w-full max-w-[520px] bg-white min-h-dvh h-dvh max-h-[960px] flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.08)]">
          {apiError && (
            <div role="alert" className="absolute left-3 right-3 top-3 z-50 flex items-start justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-800 shadow-md">
              <p>{apiError}</p>
              <button onClick={() => setApiError("")} className="shrink-0 font-semibold underline">Dismiss</button>
            </div>
          )}

          {/* Screens */}
          {flow === "idle" && tab === "home" && (
            <HomeScreen
              pickup={pickup}
              setPickup={setPickup}
              destination={destination}
              setDestination={setDestination}
              isSchedule={isSchedule}
              setIsSchedule={setIsSchedule}
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
          {flow === "idle" && tab === "profile" && <ProfileScreen user={user} />}

          {flow === "select" && (
            <SelectScreen
              pickup={pickup}
              destination={destination}
              selected={selectedOption}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isSchedule={isSchedule}
              isSubmitting={isSubmitting}
              onSelect={setSelectedOption}
              onBack={() => setFlow("idle")}
              onRequest={handleRequestRide}
            />
          )}

          {flow === "schedule" && (
            <ScheduleScreen
              pickup={pickup}
              destination={destination}
              option={selectedOption!}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
              isSubmitting={isSubmitting}
              onBack={() => setFlow("select")}
              onConfirm={handleConfirmSchedule}
            />
          )}

          {flow === "searching" && (
            <SearchingScreen isSubmitting={isSubmitting} onCancel={handleCancel} />
          )}
          {flow === "active" && activeRide && (
            <ActiveRideScreen
              ride={activeRide}
              isSubmitting={isSubmitting}
              onCancel={handleCancel}
              onComplete={handleComplete}
            />
          )}
          {flow === "completed" && activeRide && (
            <CompletedScreen ride={activeRide} onDone={handleDone} />
          )}
          {flow === "scheduled_confirm" && activeRide && (
            <ScheduledConfirmScreen ride={activeRide} onDone={handleDone} />
          )}

          {showTabs && <BottomNav active={tab} onChange={setTab} />}
        </div>

    </div>
  );
}

/* ═══════════════ HOME ═══════════════ */
function HomeScreen({
  pickup,
  setPickup,
  destination,
  setDestination,
  isSchedule,
  setIsSchedule,
  onContinue,
}: {
  pickup: string;
  setPickup: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  isSchedule: boolean;
  setIsSchedule: (v: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#f3f3f3]">
      <div className="relative flex-1 min-h-[250px] overflow-hidden bg-[#e9e9e5]">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 520 620" preserveAspectRatio="xMidYMid slice">
          <rect width="520" height="620" fill="#e9e9e5" />
          <path d="M-30 120 190 40 350 92 560 12M-30 280 160 220 340 265 560 190M-50 470 155 390 340 440 560 350M40-20 110 640M245-20 205 640M405-20 350 640M-20 555 540 95" fill="none" stroke="#fff" strokeWidth="22" />
          <path d="M-30 120 190 40 350 92 560 12M-30 280 160 220 340 265 560 190M-50 470 155 390 340 440 560 350M40-20 110 640M245-20 205 640M405-20 350 640M-20 555 540 95" fill="none" stroke="#d2d2ce" strokeWidth="2" />
          <path d="M342 324c31-23 81-17 95 15 16 37-15 72-59 76-35 3-70-18-66-48 2-17 11-31 30-43Z" fill="#d4dfd1" />
          <path d="M65 80 460 490" fill="none" stroke="#111" strokeWidth="5" strokeDasharray="1 12" strokeLinecap="round" />
          <circle cx="65" cy="80" r="8" fill="#111" stroke="white" strokeWidth="4" />
          <circle cx="460" cy="490" r="10" fill="#111" stroke="white" strokeWidth="4" />
          <text x="295" y="125" fill="#70706c" fontSize="13" fontWeight="600">ALLEN AVENUE</text>
          <text x="60" y="350" fill="#70706c" fontSize="12" fontWeight="600" transform="rotate(-18 60 350)">OPEBI ROAD</text>
          <text x="365" y="565" fill="#70706c" fontSize="12" fontWeight="600">IKEJA, LAGOS</text>
        </svg>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md">
            <span className="text-[19px] font-bold tracking-[-1px] text-black">R</span>
          </div>
          <button aria-label="Notifications" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-md">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 0 0-4-5.7V5a2 2 0 1 0-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1.1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1" /></svg>
          </button>
        </div>
        <button aria-label="Center map on current location" className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-md">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" /></svg>
        </button>
      </div>

      <section className="relative z-10 -mt-3 rounded-t-[22px] bg-white px-5 pt-5 pb-4 shadow-[0_-6px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[25px] font-bold tracking-tight text-black">Where to?</h1>
          <button onClick={() => setIsSchedule(!isSchedule)} className="inline-flex items-center gap-2 rounded-full bg-[#f3f3f3] px-3.5 py-2.5 text-[13px] font-semibold text-black">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2H5a2 2 0 0 1-2 2v12a2 2 0 0 0 2 2z" /></svg>
            {isSchedule ? "Later" : "Now"}
            <span className="text-[10px]">⌄</span>
          </button>
        </div>
        <div className="relative mb-4 rounded-[8px] bg-[#f3f3f3] px-4 py-2">
          <div className="absolute left-[23px] top-[27px] h-[35px] border-l border-dashed border-[#777]" />
          <label className="flex h-11 items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            <input aria-label="Pickup location" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Current location" className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-black outline-none placeholder:text-[#666]" />
          </label>
          <div className="h-px bg-[#ddd]" />
          <label className="flex h-11 items-center gap-3">
            <span className="h-2.5 w-2.5 bg-black" />
            <input aria-label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter destination" className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-black outline-none placeholder:text-[#666]" />
            <svg className="h-4 w-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {POPULAR_DESTINATIONS.map((place) => (
            <button key={place.id} onClick={() => { setDestination(place.name); if (!pickup) setPickup("Current location"); onContinue(); }} className="flex shrink-0 items-center gap-2 rounded-full border border-[#e5e5e5] px-3 py-2 text-[12px] font-medium text-black transition hover:bg-[#f3f3f3]">
              <span>{place.icon}</span>{place.name}
            </button>
          ))}
        </div>
        <button onClick={() => { if (!pickup) setPickup("Current location"); if (!destination) setDestination("Victoria Island, Lagos"); onContinue(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-black py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#262626] active:scale-[0.99]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h5m1 6-3-3m0 0-3 3m3-3v6" /></svg>
          Choose a ride
        </button>
      </section>
    </div>
  );
}

/* ═══════════════ SELECT ═══════════════ */
function SelectScreen({
  pickup,
  destination,
  selected,
  paymentMethod,
  setPaymentMethod,
  isSchedule,
  isSubmitting,
  onSelect,
  onBack,
  onRequest,
}: {
  pickup: string;
  destination: string;
  selected: RideOption | null;
  paymentMethod: "Cash" | "Card" | "Wallet";
  setPaymentMethod: (m: "Cash" | "Card" | "Wallet") => void;
  isSchedule: boolean;
  isSubmitting: boolean;
  onSelect: (o: RideOption) => void;
  onBack: () => void;
  onRequest: () => void;
}) {
  return (
    <>
      <div className="px-4 pt-1 pb-3 flex items-center gap-3 shrink-0 border-b border-slate-100">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500 truncate">{pickup || "Pickup"}</p>
          <p className="text-[14px] font-semibold text-slate-900 truncate">{destination || "Destination"}</p>
        </div>
        {isSchedule && (
          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            Later
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">Choose your ride</h2>
        {RIDE_OPTIONS.map((opt) => {
          const isSelected = selected?.id === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition text-left ${
                isSelected
                  ? "border-[#000000] bg-slate-100/80 shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className="w-12 h-9 bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shrink-0">
                <CarIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[15px] text-slate-900">{opt.name}</p>
                  <p className="font-bold text-[15px] text-slate-900">{formatNaira(opt.price)}</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {opt.eta} · {opt.capacity} seats · {opt.description}
                </p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#000000] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}

        <div className="pt-3">
          <p className="text-[13px] font-semibold text-slate-700 mb-2">Payment</p>
          <div className="flex gap-2">
            {(["Cash", "Card", "Wallet"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition ${
                  paymentMethod === m
                    ? "border-[#000000] bg-slate-100 text-[#262626]"
                    : "border-slate-100 text-slate-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 shrink-0 safe-bottom">
        <button
          onClick={onRequest}
          disabled={!selected || isSubmitting}
          className="w-full bg-[#000000] hover:bg-[#262626] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition active:scale-[0.99] shadow-lg shadow-slate-900/25 text-[15px]"
        >
          {isSubmitting
            ? "Saving ride..."
            : !selected
            ? "Select a ride"
            : isSchedule
              ? `Schedule ${selected.name} · ${formatNaira(selected.price)}`
              : `Request ${selected.name} · ${formatNaira(selected.price)}`}
        </button>
      </div>
    </>
  );
}

/* ═══════════════ SCHEDULE (Book for Later) ═══════════════ */
function ScheduleScreen({
  pickup,
  destination,
  option,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  isSubmitting,
  onBack,
  onConfirm,
}: {
  pickup: string;
  destination: string;
  option: RideOption;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleTime: string;
  setScheduleTime: (v: string) => void;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="px-4 pt-1 pb-3 flex items-center gap-3 shrink-0 border-b border-slate-100">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Book for Later</h2>
          <p className="text-[12px] text-slate-500">Pick date & time</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Trip summary */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#000000]" />
            <p className="text-[13px] text-slate-700 truncate">{pickup}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-red-500" />
            <p className="text-[13px] text-slate-700 truncate">{destination}</p>
          </div>
          <div className="pt-1 border-t border-slate-200 flex justify-between text-[13px]">
            <span className="text-slate-500">{option.name}</span>
            <span className="font-bold text-slate-900">{formatNaira(option.price)}</span>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-[13px] font-semibold text-slate-700 mb-2 block">Date</label>
          <input
            type="date"
            min={minDate}
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 focus:border-[#000000] rounded-xl px-4 py-3.5 text-[15px] outline-none transition"
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-[13px] font-semibold text-slate-700 mb-2 block">Time</label>
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 focus:border-[#000000] rounded-xl px-4 py-3.5 text-[15px] outline-none transition"
          />
        </div>

        <p className="text-[12px] text-slate-500 leading-relaxed">
          We’ll notify you when a driver is assigned closer to your pickup time.
        </p>
      </div>

      <div className="p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={onConfirm}
          disabled={!scheduleDate || !scheduleTime || isSubmitting}
          className="w-full bg-[#000000] hover:bg-[#262626] disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-slate-900/25 text-[15px]"
        >
          {isSubmitting ? "Saving schedule..." : `Confirm schedule · ${formatNaira(option.price)}`}
        </button>
      </div>
    </>
  );
}

/* ═══════════════ SEARCHING ═══════════════ */
function SearchingScreen({ isSubmitting, onCancel }: { isSubmitting: boolean; onCancel: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-[#000000] border-t-transparent animate-spin"
          style={{ animationDuration: "0.85s" }}
        />
        <div className="absolute inset-3 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-9 h-9 text-[#000000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h5m1 6l-3-3m0 0l-3 3m3-3v6" />
          </svg>
        </div>
      </div>
      <h2 className="text-[20px] font-bold text-slate-900 mb-1">Finding your ride...</h2>
      <p className="text-[14px] text-slate-500 mb-8">Waiting for a driver to accept your request</p>
      <button onClick={onCancel} disabled={isSubmitting} className="text-[14px] font-semibold text-red-500 active:text-red-600 disabled:opacity-50">
        {isSubmitting ? "Cancelling..." : "Cancel request"}
      </button>
    </div>
  );
}

/* ═══════════════ ACTIVE RIDE ═══════════════ */
function ActiveRideScreen({
  ride,
  isSubmitting,
  onCancel,
  onComplete,
}: {
  ride: Ride;
  isSubmitting: boolean;
  onCancel: () => void;
  onComplete: () => void;
}) {
  return (
    <>
      <div className="relative h-[290px] bg-[#f3f3f3] shrink-0">
        {/* Map grid */}
        <div className="absolute inset-0 opacity-50">
          <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <line x1="0" y1="70" x2="400" y2="70" stroke="#94a3b8" strokeWidth="7" />
            <line x1="0" y1="150" x2="400" y2="150" stroke="#94a3b8" strokeWidth="5" />
            <line x1="0" y1="230" x2="400" y2="230" stroke="#94a3b8" strokeWidth="4" />
            <line x1="70" y1="0" x2="70" y2="300" stroke="#94a3b8" strokeWidth="5" />
            <line x1="190" y1="0" x2="190" y2="300" stroke="#94a3b8" strokeWidth="7" />
            <line x1="310" y1="0" x2="310" y2="300" stroke="#94a3b8" strokeWidth="4" />
            <path
              d="M 90 230 Q 140 160 190 120 T 300 70"
              fill="none"
              stroke="#000000"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="absolute top-3 left-3 right-3">
          <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-pulse" />
            <div>
              <p className="text-[14px] font-bold text-slate-900">Driver accepted your ride</p>
              <p className="text-[12px] text-slate-500">Your assigned driver is shown below</p>
            </div>
          </div>
        </div>

        <div className="absolute left-[20%] bottom-[26%]">
          <div className="w-7 h-7 rounded-full bg-[#000000] border-[3px] border-white shadow-md" />
        </div>
        <div className="absolute right-[20%] top-[16%]">
          <div className="w-7 h-7 rounded-full bg-red-500 border-[3px] border-white shadow-md" />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[1.75rem] -mt-5 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1.5" />

        {/* Driver */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-50">
          <img
            src={ride.driver?.photo}
            alt={ride.driver?.name}
            className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-slate-100 object-cover ring-2 ring-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] text-slate-900">{ride.driver?.name}</p>
            <div className="flex items-center gap-1 text-[12px] text-slate-500">
              <span className="text-amber-400">★</span>
              <span className="font-semibold text-slate-700">{ride.driver?.rating}</span>
              <span>({ride.driver?.trips})</span>
              <span className="text-slate-300">·</span>
              <span>{ride.driver?.car}</span>
            </div>
            <p className="text-[12px] font-semibold text-slate-600 mt-0.5">{ride.driver?.plate}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 space-y-2.5 flex-1">
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#000000] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500">Pickup</p>
              <p className="text-[14px] font-medium text-slate-900">{ride.pickup}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-red-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500">Destination</p>
              <p className="text-[14px] font-medium text-slate-900">{ride.destination}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <div className="flex items-center gap-2 text-[14px]">
              <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-slate-600 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#000000]" />
                {ride.payment}
              </span>
            </div>
            <button className="text-[13px] font-semibold text-[#000000]">Share Ride</button>
          </div>
        </div>

        <div className="p-4 space-y-2 shrink-0">
          <button
            onClick={onComplete}
            disabled={isSubmitting}
            className="w-full bg-[#000000] hover:bg-[#262626] disabled:bg-slate-400 text-white font-bold py-3.5 rounded-2xl transition active:scale-[0.99] text-[15px]"
          >
            {isSubmitting ? "Updating ride..." : "Complete ride"}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full bg-white border-2 border-red-200 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 disabled:opacity-50 transition text-[15px]"
          >
            Cancel Ride
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════ COMPLETED ═══════════════ */
function CompletedScreen({ ride, onDone }: { ride: Ride; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
      <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-slate-200 flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-[#000000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-[22px] font-bold text-slate-900 mb-1">Ride completed!</h2>
      <p className="text-[14px] text-slate-500 mb-5">Thanks for riding with Routyride</p>

      <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 text-left space-y-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">Trip</span>
          <span className="font-medium text-slate-900">{ride.option.name}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">Driver</span>
          <span className="font-medium text-slate-900">{ride.driver?.name}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">Payment</span>
          <span className="font-medium text-slate-900">{ride.payment}</span>
        </div>
        <div className="flex justify-between text-[13px] border-t border-slate-200 pt-2">
          <span className="text-slate-500">Total</span>
          <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
        </div>
      </div>

      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setRating(s)}
            className={`text-[28px] transition ${s <= rating ? "text-amber-400" : "text-slate-200"}`}
          >
            ★
          </button>
        ))}
      </div>

      <button
        onClick={onDone}
        className="w-full bg-[#000000] hover:bg-[#262626] text-white font-bold py-4 rounded-2xl transition text-[15px]"
      >
        Done
      </button>
    </div>
  );
}

/* ═══════════════ SCHEDULED CONFIRM ═══════════════ */
function ScheduledConfirmScreen({ ride, onDone }: { ride: Ride; onDone: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
      <div className="w-[72px] h-[72px] rounded-full bg-amber-100 flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-[22px] font-bold text-slate-900 mb-1">Ride scheduled!</h2>
      <p className="text-[14px] text-slate-500 mb-5">
        We&apos;ll match a driver closer to your time
      </p>

      <div className="w-full bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">When</span>
          <span className="font-semibold text-slate-900">
            {ride.scheduledFor ? formatDateTime(ride.scheduledFor) : "—"}
          </span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">From</span>
          <span className="font-medium text-slate-900 truncate max-w-[180px]">{ride.pickup}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">To</span>
          <span className="font-medium text-slate-900 truncate max-w-[180px]">{ride.destination}</span>
        </div>
        <div className="flex justify-between text-[13px] border-t border-slate-200 pt-2">
          <span className="text-slate-500">Estimate</span>
          <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
        </div>
      </div>

      <button
        onClick={onDone}
        className="w-full bg-[#000000] hover:bg-[#262626] text-white font-bold py-4 rounded-2xl transition text-[15px]"
      >
        Done
      </button>
      <p className="text-[12px] text-slate-400 mt-3">View in Activity tab</p>
    </div>
  );
}

/* ═══════════════ ACTIVITY ═══════════════ */
function ActivityScreen({ history }: { history: Ride[] }) {
  const scheduled = history.filter((r) => r.status === "scheduled");
  const past = history.filter((r) => r.status !== "scheduled");

  return (
    <>
      <div className="px-5 pt-2 pb-3 shrink-0">
        <h1 className="text-[20px] font-bold text-slate-900">Activity</h1>
        <p className="text-[13px] text-slate-500">Scheduled & past rides</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {scheduled.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold text-amber-700 uppercase tracking-wide mb-2 px-1">
              Upcoming
            </p>
            <div className="space-y-2.5">
              {scheduled.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          </div>
        )}
        <div>
          {scheduled.length > 0 && (
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
              Past
            </p>
          )}
          <div className="space-y-2.5">
            {past.length === 0 && scheduled.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <p className="text-[14px]">No rides yet</p>
                <p className="text-[12px] mt-1">Book a ride to see it here</p>
              </div>
            ) : (
              past.map((ride) => <RideCard key={ride.id} ride={ride} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function RideCard({ ride }: { ride: Ride }) {
  const isScheduled = ride.status === "scheduled";
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <p className="font-semibold text-[13px] text-slate-900 truncate">
            {ride.pickup} → {ride.destination}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isScheduled && ride.scheduledFor
              ? formatDateTime(ride.scheduledFor)
              : `${formatDate(ride.createdAt)} · ${formatTime(ride.createdAt)}`}
          </p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            isScheduled
              ? "bg-amber-100 text-amber-800"
              : ride.status === "completed"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {ride.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="font-medium">{ride.option.name}</span>
          {ride.driver && (
            <>
              <span className="text-slate-300">·</span>
              <span className="truncate max-w-[100px]">{ride.driver.name}</span>
            </>
          )}
        </div>
        <span className="font-bold text-slate-900">{formatNaira(ride.price)}</span>
      </div>
    </div>
  );
}

/* ═══════════════ WALLET ═══════════════ */
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
      <div className="px-5 pt-2 pb-3 shrink-0">
        <h1 className="text-[20px] font-bold text-slate-900">Wallet</h1>
        <p className="text-[13px] text-slate-500">Manage payments</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="bg-gradient-to-br from-[#000000] to-[#262626] rounded-2xl p-5 text-white shadow-lg shadow-slate-900/20">
          <p className="text-[13px] text-slate-200">Available balance</p>
          <p className="text-[32px] font-bold mt-1 tracking-tight leading-none">
            {formatNaira(user.walletBalance)}
          </p>
          <div className="flex gap-2 mt-5">
            <button className="flex-1 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-[13px] font-semibold py-2.5 rounded-xl transition">
              Top up
            </button>
            <button className="flex-1 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-[13px] font-semibold py-2.5 rounded-xl transition">
              Withdraw
            </button>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-slate-700 mb-2">Default payment</p>
          <div className="space-y-2">
            {(["Cash", "Card", "Wallet"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition text-left ${
                  paymentMethod === m
                    ? "border-[#000000] bg-slate-100"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    paymentMethod === m ? "bg-[#000000] text-white" : "bg-slate-100"
                  }`}
                >
                  {m === "Cash" ? "💵" : m === "Card" ? "💳" : "📱"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[14px] text-slate-900">{m}</p>
                  <p className="text-[11px] text-slate-500">
                    {m === "Cash" && "Pay the driver directly"}
                    {m === "Card" && "Visa ···· 4242"}
                    {m === "Wallet" && `Balance ${formatNaira(user.walletBalance)}`}
                  </p>
                </div>
                {paymentMethod === m && (
                  <div className="w-5 h-5 rounded-full bg-[#000000] flex items-center justify-center">
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

/* ═══════════════ PROFILE ═══════════════ */
function ProfileScreen({ user }: { user: User }) {
  return (
    <>
      <div className="px-5 pt-2 pb-2 shrink-0">
        <h1 className="text-[20px] font-bold text-slate-900">Profile</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col items-center py-5">
          <img
            src={user.photo}
            alt={user.name}
            className="w-22 h-22 w-[88px] h-[88px] rounded-full bg-slate-100 object-cover ring-4 ring-slate-200"
          />
          <h2 className="text-[17px] font-bold text-slate-900 mt-3">{user.name}</h2>
          <p className="text-[13px] text-slate-500">{user.email}</p>
          <p className="text-[13px] text-slate-500">{user.phone}</p>
        </div>

        <div className="space-y-0.5">
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
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition text-left"
            >
              <span className="text-lg w-7 text-center">{item.icon}</span>
              <span className="flex-1 font-medium text-[14px] text-slate-800">{item.label}</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button className="w-full mt-5 py-3 text-red-500 font-semibold text-[14px] hover:bg-red-50 rounded-xl transition">
          Log out
        </button>
        <a href="/driver" className="mt-3 block py-3 text-center text-sm font-semibold text-slate-700 underline underline-offset-4">
          Open driver portal
        </a>
      </div>
    </>
  );
}

/* ═══════════════ BOTTOM NAV ═══════════════ */
function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "activity", label: "Activity" },
    { id: "wallet", label: "Wallet" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className="border-t border-slate-100 px-1 py-2 flex justify-around shrink-0 bg-white/95 backdrop-blur">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 min-w-[60px] py-1 transition ${
              isActive ? "text-[#000000]" : "text-slate-400"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isActive ? "bg-slate-200" : ""
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

/* ═══════════════ ICONS ═══════════════ */
function CarIcon() {
  return (
    <svg viewBox="0 0 40 24" className="w-9 h-5">
      <rect x="4" y="10" width="32" height="9" rx="2" fill="#cbd5e1" />
      <path d="M10 10 L14 4 H26 L30 10" fill="#e2e8f0" />
      <circle cx="12" cy="20" r="3.5" fill="#1e293b" />
      <circle cx="28" cy="20" r="3.5" fill="#1e293b" />
      <rect x="16" y="6" width="8" height="5" rx="0.5" fill="#d4d4d4" />
    </svg>
  );
}

