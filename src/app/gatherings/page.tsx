import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import RsvpForm from "@/components/RsvpForm";
import SparkleField from "@/components/SparkleField";
import NewsletterForm from "@/components/NewsletterForm";
import { prisma } from "@/lib/prisma";
import { media, mediaAlt } from "@/lib/media";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gatherings",
  description:
    "Tastings, sugar-free baking workshops and long-table suppers at Sweet Share. Most are free, and everyone is welcome.",
};

function dateParts(date: Date) {
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date),
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

export default async function GatheringsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { rsvps: true } } },
    }),
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 4,
    }),
  ]);

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={20} />
        <div className="shell relative text-center">
          <p className="eyebrow">Pull up a chair</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">Gatherings</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            A dessert is better with people around it. Tastings, workshops and
            long-table suppers — most of them free, all of them open to anyone
            who wants to come.
          </p>
        </div>
      </header>

      <div className="shell">
        <Reveal className="cloud-fade-b relative aspect-16/9 overflow-hidden rounded-[2rem]">
          <Image
            src={media("gathering")}
            alt={mediaAlt("gathering")}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </Reveal>
      </div>

      <section className="py-20">
        <div className="shell">
          {upcoming.length === 0 ? (
            <Reveal className="mx-auto max-w-xl rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white px-8 py-14 text-center">
              <h2 className="text-3xl">Nothing on the calendar yet</h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                We are planning the next season now. Join the list and you will
                be the first to know when the doors open.
              </p>
              <div className="mt-8 text-left">
                <NewsletterForm source="gatherings" compact />
              </div>
            </Reveal>
          ) : (
            <div className="space-y-10">
              {upcoming.map((event, index) => {
                const parts = dateParts(event.startsAt);
                const seatsLeft =
                  event.capacity != null
                    ? Math.max(0, event.capacity - event._count.rsvps)
                    : null;

                return (
                  <Reveal
                    key={event.id}
                    delay={index * 100}
                    className="card-plinth scroll-mt-32 overflow-hidden rounded-[2rem]"
                  >
                    <div id={event.slug} className="grid lg:grid-cols-[1fr_1.2fr]">
                      {event.imageUrl && (
                        <div className="relative aspect-16/10 lg:aspect-auto lg:min-h-[22rem]">
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            sizes="(min-width: 1024px) 40vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="p-8 sm:p-10">
                        <div className="flex flex-wrap items-start gap-5">
                          <div className="placard grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-center">
                            <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-candy">
                              {parts.month}
                            </span>
                            <span
                              className="block text-3xl leading-none text-plum"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {parts.day}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h2 className="text-[clamp(1.6rem,3.2vw,2.3rem)] leading-tight">
                              {event.title}
                            </h2>
                            <p className="mt-2 text-sm text-ink-faint">
                              {parts.weekday} at {parts.time} · {event.location}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="badge">
                                {event.priceCents
                                  ? formatMoney(event.priceCents)
                                  : "Free"}
                              </span>
                              {seatsLeft != null && (
                                <span className="badge">
                                  {seatsLeft > 0
                                    ? `${seatsLeft} seats left`
                                    : "Full — join the waiting list"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="mt-6 text-base leading-relaxed text-ink-soft">
                          {event.description}
                        </p>

                        <div className="mt-8 border-t border-blush/60 pt-7">
                          {event.ticketUrl ? (
                            <a
                              href={event.ticketUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="btn btn-primary btn-sheen"
                            >
                              Reserve a place
                            </a>
                          ) : (
                            <RsvpForm
                              eventId={event.id}
                              eventTitle={event.title}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="pb-24">
          <div className="shell">
            <Reveal className="rule-ornament mb-10">
              <span className="text-[0.65rem] uppercase tracking-[0.28em]">
                Gatherings past
              </span>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {past.map((event, index) => {
                const parts = dateParts(event.startsAt);
                return (
                  <Reveal
                    key={event.id}
                    delay={index * 80}
                    className="rounded-2xl border border-blush/60 bg-white/50 p-5"
                  >
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ink-faint">
                      {parts.month} {parts.day}
                    </p>
                    <h3 className="mt-2 text-lg leading-tight">{event.title}</h3>
                    <p className="mt-1.5 text-xs text-ink-faint">
                      {event.location}
                    </p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
