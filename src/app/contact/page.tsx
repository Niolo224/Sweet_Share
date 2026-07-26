import type { Metadata } from "next";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import { getSettings } from "@/lib/settings";
import { media, mediaAlt } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Catering",
  description:
    "Talk to Sweet Share about catering, wholesale, custom orders or anything at all. We answer every message ourselves.",
};

const REASONS = [
  {
    title: "Catering & events",
    body: "Church lunches, weddings, office gatherings. One dessert that works for every dietary need in the room.",
  },
  {
    title: "Custom orders",
    body: "Tell us the allergy, the occasion and the number your doctor gave you. We build to it every week.",
  },
  {
    title: "Wholesale",
    body: "Cafés and shops who want a plant-based, sugar-free case that actually sells. Let us talk.",
  },
  {
    title: "Newly diagnosed?",
    body: "Write to us even if you are not ordering. We will help you work out what is safe, ours or not.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={16} />
        <div className="shell relative text-center">
          <p className="eyebrow">We answer everything ourselves</p>
          <h1 className="mt-4 text-[clamp(2.6rem,7vw,5rem)]">Say hello</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            There is no support desk here — just us. Whatever you write, a
            person reads it, usually the same day.
          </p>
        </div>
      </header>

      <section className="py-14">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <Reveal className="space-y-8">
            <div className="halo relative aspect-3/2 overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)]">
              <Image
                src={media("giftBox")}
                alt={mediaAlt("giftBox")}
                fill
                priority
                sizes="(min-width: 1024px) 34rem, 92vw"
                className="object-cover"
              />
            </div>

            <div className="space-y-5">
              {REASONS.map((reason) => (
                <div
                  key={reason.title}
                  className="rounded-2xl border border-blush/60 bg-white/50 p-5"
                >
                  <h2 className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
                    {reason.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {reason.body}
                  </p>
                </div>
              ))}
            </div>

            {(settings.contactEmail || settings.contactPhone) && (
              <div className="placard rounded-2xl p-6">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                  Or reach us directly
                </p>
                <div className="mt-3 space-y-1.5 text-sm text-plum">
                  {settings.contactEmail && (
                    <p>
                      <a
                        href={`mailto:${settings.contactEmail}`}
                        className="underline decoration-rose/50 underline-offset-4 transition-colors hover:text-berry"
                      >
                        {settings.contactEmail}
                      </a>
                    </p>
                  )}
                  {settings.contactPhone && (
                    <p>
                      <a
                        href={`tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`}
                        className="underline decoration-rose/50 underline-offset-4 transition-colors hover:text-berry"
                      >
                        {settings.contactPhone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </Reveal>

          <Reveal delay={140}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
