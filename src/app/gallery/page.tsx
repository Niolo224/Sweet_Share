import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GalleryGrid from "@/components/GalleryGrid";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import JsonLd from "@/components/JsonLd";
import { itemListSchema, breadcrumbSchema } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Gallery — every dessert, with full nutrition",
  description:
    "Every Sweet Share dessert with its complete ingredient list, nutrition panel and net carbs. All vegan, dairy-free, egg-free and free of refined sugar. Filter by nut-free, gluten-free or gentlest on blood sugar.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "The Gallery · Sweet Share",
    description:
      "Every dessert with full nutrition and net carbs. Vegan, dairy-free, egg-free, no refined sugar.",
    url: "/gallery",
  },
};

export default async function GalleryPage() {
  const [desserts, activeMenu] = await Promise.all([
    prisma.dessert.findMany({
      orderBy: [{ isAvailable: "desc" }, { sortOrder: "asc" }],
    }),
    prisma.menu.findFirst({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return (
    <>
      <JsonLd
        data={[
          itemListSchema(desserts, "/gallery", "The Sweet Share Gallery"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "The Gallery", path: "/gallery" },
          ]),
        ]}
      />

      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={20} />
        <div className="shell relative text-center">
          <p className="eyebrow">Currently on display</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">The Gallery</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            {desserts.length} {desserts.length === 1 ? "dessert" : "desserts"},
            none of them containing dairy, eggs or refined sugar. We would
            rather do a few things properly than many things adequately. Walk
            the room, read every placard, and take home whatever you love.
          </p>

          {activeMenu && (
            <div className="placard mx-auto mt-9 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-6 py-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                Current menu
              </span>
              <span
                className="text-lg text-plum"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {activeMenu.title}
              </span>
              <span className="text-xs text-ink-faint">
                published {formatDate(activeMenu.publishedAt, "short")}
              </span>
              {activeMenu.pdfUrl && (
                <a
                  href={activeMenu.pdfUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-berry underline"
                >
                  Download PDF
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {activeMenu?.coverImageUrl && (
        <div className="shell">
          <Reveal className="cloud-fade-b relative aspect-21/9 overflow-hidden rounded-[2rem]">
            <Image
              src={activeMenu.coverImageUrl}
              alt={activeMenu.subtitle ?? activeMenu.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      )}

      <section className="py-16">
        <div className="shell">
          <GalleryGrid desserts={desserts} />
        </div>
      </section>

      <section className="pb-24">
        <div className="shell">
          <Reveal className="rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white px-8 py-12 text-center sm:px-16">
            <h2 className="text-3xl">Do you not see what you need?</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Tell us the allergy, the number your doctor gave you, or the
              birthday you are baking for. We build custom orders every week,
              and we would be glad to build yours.
            </p>
            <Link href="/contact" className="btn btn-primary btn-sheen mt-8">
              Ask us for something
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
