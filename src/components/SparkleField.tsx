"use client";

import { useMemo } from "react";

type Props = {
  /** How many motes of sugar dust to float through the light. */
  count?: number;
  className?: string;
};

/**
 * Sugar dust drifting upward through a shaft of light.
 * Positions are derived from a seeded sequence rather than Math.random so the
 * server and client render identical markup and React never complains.
 */
export default function SparkleField({ count = 26, className = "" }: Props) {
  const motes = useMemo(() => {
    // A tiny deterministic pseudo-random sequence.
    let seed = 7;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: next() * 100,
      top: 55 + next() * 45,
      size: 2 + next() * 5,
      duration: 9 + next() * 14,
      delay: next() * 14,
      opacity: 0.35 + next() * 0.5,
      gold: next() > 0.55,
    }));
  }, [count]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {motes.map((m) => (
        <span
          key={m.id}
          className="animate-sparkle absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            background: m.gold
              ? "radial-gradient(circle, #fff 0%, #f7dfae 45%, transparent 72%)"
              : "radial-gradient(circle, #fff 0%, #f9c4d4 45%, transparent 72%)",
            boxShadow: m.gold
              ? "0 0 8px 1px rgba(233,180,93,.7)"
              : "0 0 8px 1px rgba(245,143,174,.7)",
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
