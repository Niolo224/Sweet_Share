import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import EventForm from "@/components/admin/EventForm";
import SubmitButton from "@/components/admin/SubmitButton";
import { deleteEventAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { edit, saved } = await searchParams;

  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      rsvps: { orderBy: { createdAt: "desc" } },
      _count: { select: { rsvps: true } },
    },
  });

  const editing = edit ? events.find((event) => event.id === edit) : undefined;

  return (
    <div>
      <h1 className="text-4xl">Gatherings</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Tastings, workshops and suppers. Guests RSVP on the site and you see
        every name here.
      </p>

      {saved && (
        <p className="mt-6 rounded-xl border border-rose/40 bg-cloud/60 px-4 py-3 text-sm text-plum">
          Saved.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="order-2 lg:order-1">
          <EventForm key={editing?.id ?? "new"} event={editing} />
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <h2 className="text-xl">Your gatherings</h2>

          {events.length === 0 ? (
            <p className="rounded-2xl border border-blush/60 bg-white/50 p-6 text-center text-sm text-ink-faint">
              None yet — add your first with the form.
            </p>
          ) : (
            events.map((event) => {
              const past = event.startsAt < new Date();
              const guests = event.rsvps.reduce((sum, r) => sum + r.guests, 0);

              return (
                <div
                  key={event.id}
                  className={`rounded-2xl border p-5 ${
                    past
                      ? "border-blush/50 bg-white/40"
                      : "border-rose/50 bg-gradient-to-br from-cloud to-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg text-plum">
                        {event.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {formatDateTime(event.startsAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {!event.isPublished && (
                        <span className="rounded-full bg-cloud px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-ink-faint">
                          Hidden
                        </span>
                      )}
                      {past && (
                        <span className="text-[0.6rem] uppercase tracking-[0.1em] text-ink-faint">
                          Past
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs text-ink-soft">
                    <strong className="text-plum">{event._count.rsvps}</strong>{" "}
                    {event._count.rsvps === 1 ? "RSVP" : "RSVPs"} · {guests}{" "}
                    {guests === 1 ? "seat" : "seats"}
                    {event.capacity ? ` of ${event.capacity}` : ""}
                  </p>

                  {event.rsvps.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-berry">
                        See the guest list
                      </summary>
                      <ul className="mt-2 space-y-1.5 border-t border-blush/50 pt-2">
                        {event.rsvps.map((rsvp) => (
                          <li key={rsvp.id} className="text-xs text-ink-soft">
                            <span className="text-plum">{rsvp.name}</span> ·{" "}
                            <a
                              href={`mailto:${rsvp.email}`}
                              className="underline hover:text-berry"
                            >
                              {rsvp.email}
                            </a>{" "}
                            · {rsvp.guests}{" "}
                            {rsvp.guests === 1 ? "seat" : "seats"}
                            {rsvp.note && (
                              <span className="block text-ink-faint">
                                “{rsvp.note}”
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/admin/events?edit=${event.id}`}
                      className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                    >
                      Edit
                    </a>
                    {event.rsvps.length > 0 && (
                      <a
                        href={`mailto:?bcc=${event.rsvps
                          .map((r) => r.email)
                          .join(",")}&subject=${encodeURIComponent(event.title)}`}
                        className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                      >
                        Email everyone
                      </a>
                    )}
                    <form action={deleteEventAction}>
                      <input type="hidden" name="id" value={event.id} />
                      <SubmitButton
                        className="rounded-full border border-berry/40 px-3.5 py-1.5 text-xs text-berry transition-colors hover:bg-berry/10"
                        pendingLabel="…"
                        confirm={`Delete ${event.title}? Its RSVPs go too.`}
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
