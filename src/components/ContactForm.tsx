"use client";

import { useState } from "react";

const TOPICS = [
  { value: "general", label: "Just saying hello" },
  { value: "catering", label: "Catering or an event" },
  { value: "wholesale", label: "Wholesale or stocking us" },
  { value: "press", label: "Press or collaboration" },
  { value: "prayer", label: "A prayer request" },
];

export default function ContactForm() {
  const [topic, setTopic] = useState("general");
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          topic,
          subject: form.get("subject"),
          body: form.get("body"),
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("done");
        setMessage(data.message ?? "Your message is with us.");
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
      <div className="card-plinth rounded-[1.75rem] p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose to-berry text-2xl text-white">
          ✓
        </div>
        <h3 className="text-2xl">Message received</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          {message} We answer everything ourselves, usually within a day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-plinth rounded-[1.75rem] p-8 sm:p-10">
      <fieldset>
        <legend className="label">What is this about?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {TOPICS.map((option) => {
            const active = topic === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTopic(option.value)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-2 text-[0.7rem] transition-all duration-300 ${
                  active
                    ? "border-transparent bg-gradient-to-r from-rose to-berry text-white"
                    : "border-blush bg-white/60 text-ink-soft hover:border-rose hover:text-berry"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            className="field"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="field"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-phone">
            Phone — optional
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            className="field"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-subject">
            Subject — optional
          </label>
          <input
            id="contact-subject"
            name="subject"
            maxLength={120}
            className="field"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="contact-body">
          Your message
        </label>
        <textarea
          id="contact-body"
          name="body"
          required
          rows={6}
          minLength={10}
          maxLength={2000}
          className="field resize-y"
          placeholder={
            topic === "catering"
              ? "How many people, what date, and what dietary needs are in the room?"
              : "Tell us whatever you would like us to know."
          }
        />
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-berry">{message}</p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-sheen mt-7 w-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send it"}
      </button>
    </form>
  );
}
