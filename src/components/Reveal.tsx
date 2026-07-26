"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Stagger a group by passing an increasing delay, in milliseconds. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
};

/**
 * Fades and lifts its children into view once, the first time they are seen.
 * Falls back to plain visible content when IntersectionObserver is missing.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.style.transitionDelay = `${delay}ms`;
            node.classList.add("is-visible");
            observer.unobserve(node);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
