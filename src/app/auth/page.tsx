"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAnonymous(Boolean(session?.user.is_anonymous));
      setCurrentEmail(session?.user.email ?? "");
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === "signup" && isAnonymous) {
        const { error: updateError } = await supabase.auth.updateUser({ email, password });
        if (updateError) throw updateError;
        setNotice("Account details saved. Check your email if Supabase asks you to confirm your address.");
        return;
      }

      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({ email, password });
        if (signupError) throw signupError;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm your address, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({ email, password });
        if (signinError) throw signinError;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const nextPath = requestedPath === "/driver" ? "/driver" : "/ride";
      window.location.assign(nextPath);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not update your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#f3f3f3] px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl overflow-hidden rounded-md bg-white shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
        <section className="hidden w-[38%] flex-col justify-between bg-black p-8 text-white md:flex">
          <a href="/ride" className="text-sm font-bold tracking-wide">ROUTYRIDE</a>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Your account</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">Your rides, attached to you.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">Sign in on your devices and keep your ride history with your account.</p>
          </div>
          <p className="text-xs text-slate-400">Rider and driver access use separate accounts.</p>
        </section>

        <section className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12">
          <div className="mb-8 md:hidden">
            <a href="/ride" className="text-sm font-bold tracking-wide">ROUTYRIDE</a>
          </div>

          {isAnonymous && mode === "signup" && (
            <div className="mb-6 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-950">Save this rider account</p>
              <p className="mt-1 text-xs leading-5 text-emerald-900">Your current rides will stay on this account when you add email and password.</p>
            </div>
          )}

          {currentEmail && !isAnonymous && (
            <p className="mb-5 text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-900">{currentEmail}</span></p>
          )}

          <h2 className="text-2xl font-bold">{mode === "signup" ? (isAnonymous ? "Create login details" : "Create your account") : "Welcome back"}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "signup" ? "Use an email address and a password of at least 8 characters." : "Sign in to continue to Routyride."}
          </p>

          <div className="mt-6 inline-flex w-fit border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
              className={`border-b-2 px-4 py-2 text-sm font-semibold ${mode === "signin" ? "border-black text-black" : "border-transparent text-slate-500"}`}
            >Sign in</button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); setNotice(""); }}
              className={`border-b-2 px-4 py-2 text-sm font-semibold ${mode === "signup" ? "border-black text-black" : "border-transparent text-slate-500"}`}
            >Create account</button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </label>

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-black px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-400"
            >
              {isSubmitting ? "Please wait..." : mode === "signup" ? "Continue" : "Sign in"}
            </button>
          </form>

          <a href="/ride" className="mt-6 text-center text-sm text-slate-500 underline underline-offset-4">Back to rides</a>
        </section>
      </div>
    </main>
  );
}