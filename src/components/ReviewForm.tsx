"use client";

import { useState } from "react";

type Option = { id: string; name: string };

export default function ReviewForm({ desserts }: { desserts: Option[] }) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [joinList, setJoinList] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    setStatus("sending");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          location: form.get("location"),
          dessertId: form.get("dessertId") || null,
          title: form.get("title"),
          body: form.get("body"),
          rating,
          joinList,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("done");
        setMessage(data.message ?? "Thank you. We read every one of these.");
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
          ♥
        </div>
        <h3 className="text-2xl">Thank you</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          {message}
        </p>
      </div>
    );
  }

  const shown = hovered || rating;

  return (
    <form onSubmit={onSubmit} className="card-plinth rounded-[1.75rem] p-8 sm:p-10">
      <h3 className="text-2xl">Leave a word</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Reviews are read by a person before they appear, usually within a day.
        Your email is never published.
      </p>

      {/* Stars */}
      <fieldset className="mt-7">
        <legend className="label">How was it?</legend>
        <div className="flex items-center gap-1.5" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="transition-transform duration-200 hover:scale-115"
            >
              <svg
                viewBox="0 0 20 20"
                className={`h-8 w-8 transition-colors duration-200 ${
                  n <= shown ? "text-gold" : "text-cloud-2"
                }`}
                fill="currentColor"
              >
                <path d="M10 1.6l2.47 5.28 5.53.72-4.06 3.9 1.03 5.68L10 14.4l-4.97 2.78 1.03-5.68-4.06-3.9 5.53-.72L10 1.6Z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="review-name">
            Your name
          </label>
          <input
            id="review-name"
            name="name"
            required
            maxLength={80}
            className="field"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="review-email">
            Email — kept private
          </label>
          <input
            id="review-email"
            name="email"
            type="email"
            className="field"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="review-location">
            Where are you from?
          </label>
          <input
            id="review-location"
            name="location"
            maxLength={60}
            className="field"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="label" htmlFor="review-dessert">
            Which dessert?
          </label>
          <select id="review-dessert" name="dessertId" className="field">
            <option value="">All of it / not sure</option>
            {desserts.map((dessert) => (
              <option key={dessert.id} value={dessert.id}>
                {dessert.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="review-title">
          Give it a headline
        </label>
        <input
          id="review-title"
          name="title"
          maxLength={90}
          className="field"
          placeholder="Optional"
        />
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="review-body">
          Tell us about it
        </label>
        <textarea
          id="review-body"
          name="body"
          required
          rows={5}
          minLength={10}
          maxLength={1500}
          className="field resize-y"
          placeholder="What did you order, who did you share it with, and how did it go?"
        />
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={joinList}
          onChange={(e) => setJoinList(e.target.checked)}
          className="mt-1 accent-[#ee6f94]"
        />
        Also add me to the list for new menus and gatherings.
      </label>

      {status === "error" && (
        <p className="mt-4 text-sm text-berry">{message}</p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-sheen mt-7 w-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Share your word"}
      </button>
    </form>
  );
}
