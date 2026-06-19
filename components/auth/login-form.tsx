"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Te enviamos un link a tu email. Abrilo desde este dispositivo.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="h-12 rounded-xl bg-emerald-700 text-base font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Enviando..." : "Enviar magic link"}
      </button>

      {message ? (
        <p
          className={`text-sm ${status === "error" ? "text-red-600" : "text-emerald-700"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
