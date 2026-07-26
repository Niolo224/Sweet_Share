"use client";

import { useState } from "react";

export type QA = { q: string; a: string };

export default function Accordion({ items }: { items: QA[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-blush/60 overflow-hidden rounded-[1.75rem] border border-blush/60 bg-white/50">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-start justify-between gap-6 px-7 py-6 text-left transition-colors hover:bg-cloud/40"
              >
                <span
                  className={`text-lg leading-snug transition-colors ${
                    open ? "text-berry" : "text-plum"
                  }`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-sm transition-all duration-500 ${
                    open
                      ? "rotate-45 border-berry text-berry"
                      : "border-blush text-ink-faint"
                  }`}
                >
                  +
                </span>
              </button>
            </h3>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-7 pb-7 text-sm leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
