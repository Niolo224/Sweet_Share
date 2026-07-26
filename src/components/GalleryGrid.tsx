"use client";

import { useMemo, useState } from "react";
import DessertCard, { type DessertCardData } from "./DessertCard";
import { netCarbs, parseList } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "Everything" },
  { value: "cakes", label: "Cakes" },
  { value: "tarts", label: "Tarts" },
  { value: "cookies", label: "Cookies" },
  { value: "pastries", label: "Pastries" },
  { value: "puddings", label: "Puddings" },
  { value: "breads", label: "Breads" },
  { value: "seasonal", label: "Gift boxes" },
];

const NEEDS = [
  { value: "nut-free", label: "Nut free", test: (badges: string[]) => badges.includes("nut-free") },
  {
    value: "gluten-free",
    label: "Gluten free",
    test: (badges: string[]) => badges.includes("gluten-free"),
  },
  {
    value: "diabetes-friendly",
    label: "Gentlest on blood sugar",
    test: (badges: string[]) => badges.includes("diabetes-friendly"),
  },
];

export default function GalleryGrid({
  desserts,
}: {
  desserts: DessertCardData[];
}) {
  const [category, setCategory] = useState("all");
  const [needs, setNeeds] = useState<string[]>([]);
  const [sort, setSort] = useState<"curated" | "gentlest" | "price">("curated");

  const available = useMemo(() => {
    const categoriesPresent = new Set(desserts.map((d) => d.category));
    return CATEGORIES.filter(
      (c) => c.value === "all" || categoriesPresent.has(c.value),
    );
  }, [desserts]);

  const shown = useMemo(() => {
    let list = desserts.filter((dessert) => {
      const badges = parseList(dessert.badges);

      if (category !== "all" && dessert.category !== category) return false;
      for (const need of needs) {
        const rule = NEEDS.find((n) => n.value === need);
        if (rule && !rule.test(badges)) return false;
      }
      return true;
    });

    if (sort === "gentlest") {
      list = [...list].sort(
        (a, b) =>
          (netCarbs(a.totalCarbsG, a.fiberG, a.sugarAlcoholG) ?? 999) -
          (netCarbs(b.totalCarbsG, b.fiberG, b.sugarAlcoholG) ?? 999),
      );
    } else if (sort === "price") {
      list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    }

    return list;
  }, [desserts, category, needs, sort]);

  function toggleNeed(value: string) {
    setNeeds((current) =>
      current.includes(value)
        ? current.filter((n) => n !== value)
        : [...current, value],
    );
  }

  return (
    <div>
      <div className="mb-12 space-y-6">
        {/* Rooms of the gallery */}
        <div className="flex flex-wrap justify-center gap-2">
          {available.map((item) => {
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.12em] transition-all duration-400 ${
                  active
                    ? "border-transparent bg-gradient-to-r from-rose to-berry text-white shadow-[0_8px_20px_-10px_rgba(201,63,108,.9)]"
                    : "border-blush bg-white/60 text-ink-soft hover:border-rose hover:text-berry"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Dietary needs and sorting */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-faint">
              I need
            </span>
            {NEEDS.map((need) => {
              const active = needs.includes(need.value);
              return (
                <button
                  key={need.value}
                  type="button"
                  onClick={() => toggleNeed(need.value)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.68rem] transition-all duration-300 ${
                    active
                      ? "border-rose bg-cloud text-berry"
                      : "border-blush/70 bg-white/50 text-ink-soft hover:border-rose"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {need.label}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-ink-faint">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-full border border-blush bg-white/70 px-3 py-1.5 text-[0.7rem] normal-case tracking-normal text-ink"
            >
              <option value="curated">As curated</option>
              <option value="gentlest">Gentlest first</option>
              <option value="price">Price, low to high</option>
            </select>
          </label>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">
          Nothing in the collection matches that combination just yet. Try
          loosening one filter — or{" "}
          <a href="/contact" className="text-berry underline">
            ask us
          </a>{" "}
          and we will bake to it.
        </p>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((dessert, index) => (
            <DessertCard
              key={dessert.id}
              dessert={dessert}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-ink-faint">
        Showing {shown.length} of {desserts.length}
      </p>
    </div>
  );
}
