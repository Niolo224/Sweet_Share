"use client";

import { useState } from "react";

export default function RsvpForm({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [joinList, setJoinList] = useState(true);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    setStatus("sending");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: form.get("name"),
          email: form.get("email"),
          guests: Number(form.get("guests") ?? 1),
          note: form.get("note"),
          joinList,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("done");
        setMessage(data.message ?? "You are on the list. We cannot wait.");
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
      <p className="rounded-xl border border-rose/40 bg-white/70 px-4 py-3 text-sm text-plum">
        {message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary btn-sheen"
      >
        Save me a seat
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-faint">
        RSVP · {eventTitle}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`rsvp-name-${eventId}`}>
            Your name
          </label>
          <input
            id={`rsvp-name-${eventId}`}
            name="name"
            required
            className="field"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor={`rsvp-email-${eventId}`}>
            Email
          </label>
          <input
            id={`rsvp-email-${eventId}`}
            name="email"
            type="email"
            required
            className="field"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div>
          <label className="label" htmlFor={`rsvp-guests-${eventId}`}>
            Seats
          </label>
          <input
            id={`rsvp-guests-${eventId}`}
            name="guests"
            type="number"
            min={1}
            max={12}
            defaultValue={1}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor={`rsvp-note-${eventId}`}>
            Anything we should know?
          </label>
          <input
            id={`rsvp-note-${eventId}`}
            name="note"
            className="field"
            placeholder="Allergies, questions, who you are bringing"
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={joinList}
          onChange={(e) => setJoinList(e.target.checked)}
          className="mt-1 accent-[#ee6f94]"
        />
        Add me to the Sweet Share list for new menus and gatherings.
      </label>

      {status === "error" && <p className="text-xs text-berry">{message}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="btn btn-primary btn-sheen"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Saving…" : "Confirm my seat"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost"
        >
          Never mind
        </button>
      </div>
    </form>
  );
}
