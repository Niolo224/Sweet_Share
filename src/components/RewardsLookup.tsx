"use client";

import { useState } from "react";

export default function RewardsLookup() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    setStatus("sending");

    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("done");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("We could not reach the kitchen. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-2xl border border-rose/40 bg-white/70 px-5 py-4 text-sm leading-relaxed text-plum">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="label" htmlFor="rewards-email">
        Your email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="rewards-email"
          name="email"
          type="email"
          required
          className="field"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button
          type="submit"
          className="btn btn-primary btn-sheen shrink-0"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Checking…" : "Send my balance"}
        </button>
      </div>

      {status === "error" && <p className="text-xs text-berry">{message}</p>}

      <p className="text-[0.68rem] leading-relaxed text-ink-faint">
        We email your balance rather than showing it here, so nobody can look up
        somebody else&rsquo;s.
      </p>
    </form>
  );
}
