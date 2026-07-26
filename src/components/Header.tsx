"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useCart } from "./CartProvider";

const NAV = [
  { href: "/gallery", label: "The Gallery" },
  { href: "/pantry", label: "The Pantry" },
  { href: "/story", label: "Our Story" },
  { href: "/gatherings", label: "Gatherings" },
  { href: "/testimonials", label: "Kind Words" },
];

export default function Header({ announcement }: { announcement: string }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever we navigate.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="no-print sticky top-0 z-50">
      {announcement && (
        <div className="bg-gradient-to-r from-rose via-candy to-berry px-4 py-2 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-white">
          {announcement}
        </div>
      )}

      <div
        className={`transition-all duration-500 ${
          scrolled
            ? "glass shadow-[0_10px_30px_-18px_rgba(201,63,108,0.5)]"
            : "bg-transparent"
        }`}
      >
        <div className="shell flex h-20 items-center justify-between gap-6">
          <Link href="/" aria-label="Sweet Share — home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-[0.78rem] font-medium uppercase tracking-[0.16em] transition-colors ${
                    active ? "text-berry" : "text-ink-soft hover:text-berry"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-candy transition-all duration-500 ${
                      active ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/order" className="btn btn-primary btn-sheen hidden sm:inline-flex">
              Order ahead
              {ready && count > 0 && (
                <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-[0.65rem] font-semibold text-berry">
                  {count}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              className="grid h-11 w-11 place-items-center rounded-full border border-blush bg-white/70 lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 h-px w-full bg-ink transition-all duration-300 ${
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-px w-full bg-ink transition-opacity duration-300 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-full bg-ink transition-all duration-300 ${
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`glass overflow-hidden border-t border-blush/60 transition-[max-height,opacity] duration-500 lg:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="shell flex flex-col gap-1 py-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors hover:bg-cloud hover:text-berry"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/order" className="btn btn-primary mt-3">
            Order ahead {ready && count > 0 ? `(${count})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
