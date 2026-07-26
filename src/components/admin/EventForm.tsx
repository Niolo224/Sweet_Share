"use client";

import { useActionState } from "react";
import { saveEventAction, type ActionState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

type EventRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string;
  address: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  capacity: number | null;
  priceCents: number | null;
  isPublished: boolean;
};

/** <input type="datetime-local"> wants a local YYYY-MM-DDTHH:mm string. */
function forInput(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EventForm({ event }: { event?: EventRecord }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveEventAction,
    null,
  );

  return (
    <form action={formAction} className="card-plinth space-y-6 rounded-2xl p-6 sm:p-7">
      {event && <input type="hidden" name="id" value={event.id} />}

      <h2 className="text-2xl">
        {event ? `Edit “${event.title}”` : "Add a gathering"}
      </h2>

      {state?.error && (
        <p className="rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {state.error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="event-title">
          Title <span className="text-berry">*</span>
        </label>
        <input
          id="event-title"
          name="title"
          required
          defaultValue={event?.title}
          className="field"
          placeholder="The Sunday Tasting Table"
        />
      </div>

      <div>
        <label className="label" htmlFor="event-description">
          Description
        </label>
        <textarea
          id="event-description"
          name="description"
          rows={4}
          defaultValue={event?.description}
          className="field resize-y"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="event-starts">
            Starts <span className="text-berry">*</span>
          </label>
          <input
            id="event-starts"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={forInput(event?.startsAt ?? null)}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="event-ends">
            Ends
          </label>
          <input
            id="event-ends"
            name="endsAt"
            type="datetime-local"
            defaultValue={forInput(event?.endsAt ?? null)}
            className="field"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="event-location">
            Place
          </label>
          <input
            id="event-location"
            name="location"
            defaultValue={event?.location ?? "The Sweet Share Kitchen"}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="event-address">
            Address
          </label>
          <input
            id="event-address"
            name="address"
            defaultValue={event?.address ?? ""}
            className="field"
            placeholder="Shared privately on RSVP"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="event-price">
            Price
          </label>
          <input
            id="event-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              event?.priceCents ? (event.priceCents / 100).toFixed(2) : "0"
            }
            className="field"
          />
          <p className="mt-1.5 text-[0.68rem] text-ink-faint">
            Leave at 0 for a free gathering.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="event-capacity">
            Seats
          </label>
          <input
            id="event-capacity"
            name="capacity"
            type="number"
            min="1"
            defaultValue={event?.capacity ?? ""}
            className="field"
            placeholder="Leave blank for unlimited"
          />
        </div>
        <div>
          <label className="label" htmlFor="event-ticket">
            External ticket link
          </label>
          <input
            id="event-ticket"
            name="ticketUrl"
            defaultValue={event?.ticketUrl ?? ""}
            className="field"
            placeholder="Optional — replaces our RSVP form"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="event-image">
          Picture
        </label>
        <input
          id="event-image"
          name="imageFile"
          type="file"
          accept="image/*"
          className="field file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-4 file:py-1.5 file:text-xs file:text-plum"
        />
        <input
          name="imageUrl"
          defaultValue={event?.imageUrl ?? ""}
          className="field mt-2"
          placeholder="…or paste an image address"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={event?.isPublished ?? true}
          className="h-4 w-4 accent-[#ee6f94]"
        />
        Show this on the gatherings page
      </label>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Saving…">
          {event ? "Save gathering" : "Add gathering"}
        </SubmitButton>
        {event && (
          <a href="/admin/events" className="btn btn-ghost">
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
