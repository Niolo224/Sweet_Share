import type { Metadata } from "next";
import Link from "next/link";
import { isSignedIn } from "@/lib/auth";
import { signOutAction } from "./actions";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "The Kitchen",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/desserts", label: "Desserts" },
  { href: "/admin/menus", label: "Menus" },
  { href: "/admin/events", label: "Gatherings" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/subscribers", label: "Email list" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Site copy" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const signedIn = await isSignedIn();

  if (!signedIn) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-blush/60 bg-white/85 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo showWordmark={false} />
            <span className="text-sm font-medium uppercase tracking-[0.18em] text-plum">
              The Kitchen
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-ink-soft transition-colors hover:text-berry"
            >
              View shop ↗
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-blush px-4 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="border-t border-blush/50 bg-cloud/40">
          <div className="shell flex gap-1 overflow-x-auto py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-white hover:text-berry"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="shell py-10">{children}</main>
    </div>
  );
}
