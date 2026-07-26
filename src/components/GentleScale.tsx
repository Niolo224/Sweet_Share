"use client";

import { useState } from "react";

export type ScaleItem = {
  slug: string;
  name: string;
  netCarbsG: number;
  addedSugarsG: number;
  /** What the same-sized slice looks like at a conventional bakery. */
  conventionalNetCarbsG: number;
  conventionalAddedSugarsG: number;
  note: string;
};

/**
 * "The Gentle Scale" — an interactive comparison that shows, honestly, how a
 * Sweet Share dessert sits next to its conventional counterpart.
 */
export default function GentleScale({ items }: { items: ScaleItem[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug ?? "");
  const active = items.find((i) => i.slug === activeSlug) ?? items[0];

  if (!active) return null;

  const ceiling = Math.max(
    active.conventionalNetCarbsG,
    active.conventionalAddedSugarsG,
    active.netCarbsG,
    active.addedSugarsG,
    1,
  );
  const pct = (value: number) => `${Math.max(2, (value / ceiling) * 100)}%`;

  return (
    <div className="card-plinth overflow-hidden rounded-[1.75rem] p-7 sm:p-10">
      <div className="mb-7 flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive = item.slug === active.slug;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => setActiveSlug(item.slug)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.12em] transition-all duration-400 ${
                isActive
                  ? "border-transparent bg-gradient-to-r from-rose to-berry text-white shadow-[0_8px_20px_-10px_rgba(201,63,108,.9)]"
                  : "border-blush bg-white/60 text-ink-soft hover:border-rose hover:text-berry"
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Bars
          heading="A typical bakery version"
          tone="conventional"
          netCarbs={active.conventionalNetCarbsG}
          addedSugars={active.conventionalAddedSugarsG}
          pct={pct}
        />
        <Bars
          heading="The Sweet Share version"
          tone="ours"
          netCarbs={active.netCarbsG}
          addedSugars={active.addedSugarsG}
          pct={pct}
        />
      </div>

      <p className="mt-8 border-t border-blush/60 pt-6 text-sm leading-relaxed text-ink-soft">
        {active.note}
      </p>
      <p className="mt-3 text-[0.68rem] leading-relaxed text-ink-faint">
        Comparison figures are typical published values for an equivalent
        serving of a conventional dessert, shown for context. Ours are our own
        estimates. Neither is medical advice.
      </p>
    </div>
  );
}

function Bars({
  heading,
  tone,
  netCarbs,
  addedSugars,
  pct,
}: {
  heading: string;
  tone: "conventional" | "ours";
  netCarbs: number;
  addedSugars: number;
  pct: (value: number) => string;
}) {
  const ours = tone === "ours";
  return (
    <div
      className={`rounded-2xl p-6 transition-colors ${
        ours ? "bg-gradient-to-br from-cloud to-white" : "bg-white/50"
      }`}
    >
      <h4
        className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${
          ours ? "text-berry" : "text-ink-faint"
        }`}
      >
        {heading}
      </h4>

      <Row
        label="Net carbs"
        value={netCarbs}
        width={pct(netCarbs)}
        ours={ours}
      />
      <Row
        label="Added sugar"
        value={addedSugars}
        width={pct(addedSugars)}
        ours={ours}
      />
    </div>
  );
}

function Row({
  label,
  value,
  width,
  ours,
}: {
  label: string;
  value: number;
  width: string;
  ours: boolean;
}) {
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-ink-faint">
          {label}
        </span>
        <span
          className={`text-lg tabular-nums ${ours ? "text-berry" : "text-ink-soft"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value} g
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-cloud-2/70">
        <div
          className={`h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            ours
              ? "bg-gradient-to-r from-rose to-berry"
              : "bg-gradient-to-r from-ink-faint/50 to-ink-faint"
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}
