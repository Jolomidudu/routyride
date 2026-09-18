import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/40 to-emerald-50">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 text-white"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" fill="white" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              Routy<span className="text-green-600">ride</span>
            </span>
            <p className="text-[10px] tracking-[0.2em] text-slate-500 font-medium uppercase -mt-0.5">
              Ride · Arrive · Repeat
            </p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-green-600 transition">
            Features
          </a>
          <a href="#how" className="hover:text-green-600 transition">
            How it works
          </a>
          <Link
            href="/ride"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full transition shadow-sm"
          >
            Open App
          </Link>
        </nav>
        <Link
          href="/ride"
          className="md:hidden bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          Open App
        </Link>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-20 lg:pt-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                Your ride,{" "}
                <span className="text-green-600">your way.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-lg leading-relaxed">
                Fast, safe and reliable rides whenever you need them.
                Anywhere, anytime.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ride"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-green-600/25 transition-all hover:scale-[1.02]"
              >
                Request a Ride
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
              <Link
                href="/ride?book=later"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-7 py-3.5 rounded-full border-2 border-slate-200 transition-all"
              >
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Book for Later
              </Link>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  label: "Fast Pickup",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  label: "Safe Rides",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ),
                  label: "Multiple Payment Options",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ),
                  label: "24/7 Support",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center gap-2 p-3"
                >
                  <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Car illustration */}
            <div className="pt-6 hidden sm:block">
              <div className="relative w-full max-w-md">
                <div className="absolute -bottom-4 left-8 right-8 h-6 bg-green-600/20 blur-xl rounded-full" />
                <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex items-center gap-4">
                  <div className="w-28 h-16 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 120 60" className="w-full h-full">
                      {/* Simple car SVG */}
                      <rect x="15" y="25" width="90" height="22" rx="4" fill="#f8fafc" stroke="#16a34a" strokeWidth="2" />
                      <path d="M25 25 L35 12 H75 L90 25" fill="#e2e8f0" stroke="#16a34a" strokeWidth="1.5" />
                      <circle cx="35" cy="48" r="8" fill="#1e293b" />
                      <circle cx="85" cy="48" r="8" fill="#1e293b" />
                      <circle cx="35" cy="48" r="3" fill="#94a3b8" />
                      <circle cx="85" cy="48" r="3" fill="#94a3b8" />
                      <rect x="40" y="15" width="30" height="12" rx="1" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1" />
                      <text x="55" y="38" textAnchor="middle" fontSize="7" fill="#16a34a" fontWeight="bold">Routyride</text>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Toyota Corolla</p>
                    <p className="text-sm text-slate-500">Clean · Verified · Nearby</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Phone mockups */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px]">
              {/* Phone 1 - Home */}
              <div className="relative z-10 bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-900/30 border-[6px] border-slate-800">
                <div className="bg-white rounded-[2rem] overflow-hidden h-[620px] flex flex-col">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-medium text-slate-900">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h20v2H2v-2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48L7 9.47l-.85-1.48-1.3.75.85 1.48L4 11.47l-.85-1.48-1.3.75.85 1.48zM12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                      <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9v6h3V9H1zm4 0v6h3V9H5zm4 0v6h3V9H9zm4 0v6h3V9h-3zm4 0v6h3V9h-3zm4 0v6h3V9h-3z"/></svg>
                      <div className="w-5 h-2.5 border border-slate-900 rounded-sm relative">
                        <div className="absolute inset-0.5 bg-slate-900 rounded-[1px] w-[70%]" />
                      </div>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="px-4 pt-2 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        Routy<span className="text-green-600">ride</span>
                      </span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
                  </div>

                  <div className="px-4 space-y-3 flex-1 overflow-hidden">
                    <div>
                      <p className="text-xs text-slate-500">Good morning,</p>
                      <h2 className="text-lg font-bold text-slate-900">Where are you going?</h2>
                    </div>

                    {/* Location inputs */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <input
                          readOnly
                          placeholder="Enter pickup location"
                          className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="border-t border-dashed border-slate-200 my-1" />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <input
                          readOnly
                          placeholder="Enter destination"
                          className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Promo card */}
                    <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3">
                      <div className="relative z-10">
                        <p className="text-xs font-medium text-green-300">Ride smarter</p>
                        <p className="text-sm font-bold">with Routyride.</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">Comfort, safety and convenience — always.</p>
                        <button className="mt-2 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                          Book a Ride →
                        </button>
                      </div>
                      <div className="absolute right-0 bottom-0 w-24 h-16 opacity-80">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                          <rect x="10" y="20" width="70" height="18" rx="3" fill="#f1f5f9" />
                          <path d="M20 20 L28 10 H55 L68 20" fill="#e2e8f0" />
                          <circle cx="25" cy="40" r="6" fill="#1e293b" />
                          <circle cx="65" cy="40" r="6" fill="#1e293b" />
                        </svg>
                      </div>
                    </div>

                    {/* Choose a ride */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-900">Choose a Ride</h3>
                        <span className="text-xs text-green-600 font-medium">See all</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: "Economy", price: "₦1,500", time: "4 min", color: "bg-slate-100" },
                          { name: "Comfort", price: "₦2,500", time: "6 min", color: "bg-green-50 border border-green-200" },
                          { name: "SUV", price: "₦4,000", time: "8 min", color: "bg-slate-100" },
                          { name: "Premium", price: "₦6,000", time: "10 min", color: "bg-slate-100" },
                        ].map((ride) => (
                          <div
                            key={ride.name}
                            className={`${ride.color} rounded-xl p-2 text-center`}
                          >
                            <div className="w-8 h-5 mx-auto mb-1 bg-slate-300 rounded-sm" />
                            <p className="text-[10px] font-semibold text-slate-800">{ride.name}</p>
                            <p className="text-[10px] font-bold text-slate-900">{ride.price}</p>
                            <p className="text-[9px] text-slate-500">{ride.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Popular destinations */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-900">Popular Destinations</h3>
                        <span className="text-xs text-green-600 font-medium">See all</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: "Airport", sub: "Travel hassle-free", icon: "✈️" },
                          { name: "Mall", sub: "Shop & relax", icon: "🛍️" },
                          { name: "Office", sub: "Get there on time", icon: "🏢" },
                          { name: "Home", sub: "Back to what matters", icon: "🏠" },
                        ].map((d) => (
                          <div key={d.name} className="bg-slate-50 rounded-xl p-2 text-center">
                            <div className="text-lg mb-0.5">{d.icon}</div>
                            <p className="text-[10px] font-semibold text-slate-800">{d.name}</p>
                            <p className="text-[8px] text-slate-500 leading-tight">{d.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="border-t border-slate-100 px-2 py-2 flex justify-around text-[10px] text-slate-500">
                    {[
                      { label: "Home", active: true },
                      { label: "Ride", active: false },
                      { label: "Activity", active: false },
                      { label: "Wallet", active: false },
                      { label: "Profile", active: false },
                    ].map((tab) => (
                      <div
                        key={tab.label}
                        className={`flex flex-col items-center gap-0.5 ${tab.active ? "text-green-600" : ""}`}
                      >
                        <div className={`w-5 h-5 rounded-full ${tab.active ? "bg-green-100" : "bg-slate-100"}`} />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -right-8 top-20 w-48 h-48 bg-green-200/40 rounded-full blur-3xl" />
              <div className="absolute -z-10 -left-10 bottom-32 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer strip */}
      <footer className="border-t border-slate-100 bg-white/80 backdrop-blur py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-700">Routyride</span>
            <span>© 2026</span>
          </div>
          <p>Built with Next.js · Fast, safe rides across Nigeria</p>
        </div>
      </footer>
    </div>
  );
}
