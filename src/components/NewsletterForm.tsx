"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export default function NewsletterForm({
  source = "footer",
  compact = false,
}: {
  source?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("done");
        setMessage(data.message ?? "You're on the list. Welcome in.");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went sideways. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the kitchen. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-xl border border-rose/40 bg-white/70 px-4 py-3 text-sm text-plum">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      {!compact && (
        <label className="sr-only" htmlFor={`nl-name-${source}`}>
          First name
        </label>
      )}
      {!compact && (
        <input
          id={`nl-name-${source}`}
          className="field"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name (optional)"
          autoComplete="given-name"
        />
      )}

      <label className="sr-only" htmlFor={`nl-email-${source}`}>
        Email address
      </label>
      <div className={compact ? "flex flex-col gap-2 sm:flex-row" : "space-y-2.5"}>
        <input
          id={`nl-email-${source}`}
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button
          type="submit"
          className="btn btn-primary btn-sheen shrink-0"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Adding…" : "Join us"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-berry">{message}</p>
      )}
      <p className="text-[0.68rem] leading-relaxed text-ink-faint">
        We send new menus and gathering invitations. Unsubscribe any time — no
        hard feelings, ever.
      </p>
    </form>
  );
}
