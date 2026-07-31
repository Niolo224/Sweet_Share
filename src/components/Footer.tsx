import Link from "next/link";
import Logo from "./Logo";
import NewsletterForm from "./NewsletterForm";

const COLUMNS = [
  {
    heading: "Visit",
    links: [
      { href: "/gallery", label: "The Gallery" },
      { href: "/club", label: "The Club" },
      { href: "/pantry", label: "The Pantry" },
      { href: "/gatherings", label: "Gatherings" },
      { href: "/order", label: "Order ahead" },
    ],
  },
  {
    heading: "Know us",
    links: [
      { href: "/story", label: "Our story" },
      { href: "/rewards", label: "The Table — rewards" },
      { href: "/gift-cards", label: "Gift cards" },
      { href: "/testimonials", label: "Kind words" },
      { href: "/faq", label: "Questions & facts" },
      { href: "/contact", label: "Contact & catering" },
    ],
  },
];

export default function Footer({
  contactEmail,
  contactPhone,
  instagram,
  facebook,
}: {
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  facebook: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print relative mt-24 overflow-hidden border-t border-blush/60 bg-gradient-to-b from-cloud/60 to-cloud-2/50">
      <div className="shell relative z-10 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.6fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
              Plant-based desserts made gently — no dairy, no eggs, no refined
              sugar. Baked in small batches and made to be shared.
            </p>
            <p className="verse mt-6 max-w-xs text-base">
              “Taste and see that the Lord is good.”
              <span className="mt-1 block text-xs font-medium uppercase not-italic tracking-[0.2em] text-candy">
                Psalm 34:8
              </span>
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="eyebrow mb-4">{column.heading}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-berry"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="eyebrow mb-4">Join the table</h3>
            <p className="mb-4 text-sm leading-relaxed text-ink-soft">
              New menus, gatherings and a little encouragement — once or twice a
              month, never more.
            </p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-blush/60 pt-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Sweet Share. Made with joy, and shared with love.</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="transition-colors hover:text-berry"
              >
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a
                href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
                className="transition-colors hover:text-berry"
              >
                {contactPhone}
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="transition-colors hover:text-berry"
              >
                Instagram
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noreferrer noopener"
                className="transition-colors hover:text-berry"
              >
                Facebook
              </a>
            )}
            <Link href="/admin" className="transition-colors hover:text-berry">
              Kitchen login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-[0.68rem] leading-relaxed text-ink-faint/80">
          Every Sweet Share dessert is made without dairy, eggs or refined
          sugar. Nutrition figures are careful estimates, not medical advice —
          if you are managing diabetes or a serious allergy, please read the
          full ingredient list and check with your care team. Baked in a kitchen
          that handles tree nuts, coconut, soy, sesame and gluten.
        </p>
      </div>
    </footer>
  );
}
