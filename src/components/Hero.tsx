"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SparkleField from "./SparkleField";

type Props = {
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  verse: string;
  verseRef: string;
};

export default function Hero({
  imageUrl,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  verse,
  verseRef,
}: Props) {
  const [offset, setOffset] = useState(0);
  const frame = useRef<number | null>(null);

  // A slow parallax drift on the sky behind the words.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(() => {
        setOffset(Math.min(window.scrollY * 0.32, 260));
        frame.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <section className="relative flex min-h-[92svh] items-center justify-center overflow-hidden">
      {/* Sky */}
      <div
        className="absolute inset-0 -z-10 scale-110"
        style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.12)` }}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Light wash so the type always reads */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/55 via-white/25 to-paper" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_40%,transparent_20%,rgba(255,246,248,0.75)_100%)]" />

      <SparkleField count={34} className="-z-10" />

      <div className="shell relative py-28 text-center">
        <p className="eyebrow animate-rise">{eyebrow}</p>

        <h1
          className="animate-rise mt-6 text-[clamp(3.2rem,11vw,9rem)] leading-[0.92]"
          style={{ animationDelay: "120ms" }}
        >
          <span className="text-shimmer">{title}</span>
        </h1>

        <p
          className="animate-rise mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl"
          style={{ animationDelay: "240ms" }}
        >
          {subtitle}
        </p>

        <div
          className="animate-rise mt-11 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "360ms" }}
        >
          <Link href="/gallery" className="btn btn-primary btn-sheen">
            Enter the gallery
          </Link>
          <Link href="/order" className="btn btn-ghost">
            Order ahead
          </Link>
        </div>

        <figure
          className="animate-rise mx-auto mt-16 max-w-md"
          style={{ animationDelay: "500ms" }}
        >
          <div className="rule-ornament mb-5">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 4c1.5 2.6 3.4 3.6 6 4-2.6.4-4.5 1.4-6 4-1.5-2.6-3.4-3.6-6-4 2.6-.4 4.5-1.4 6-4Z" />
            </svg>
          </div>
          <blockquote className="verse">“{verse}”</blockquote>
          <figcaption className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-candy">
            {verseRef}
          </figcaption>
        </figure>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-levitate">
        <span className="flex h-11 w-6 items-start justify-center rounded-full border border-rose/60 p-1.5">
          <span className="h-2 w-1 rounded-full bg-candy" />
        </span>
      </div>
    </section>
  );
}
