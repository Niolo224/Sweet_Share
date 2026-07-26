import Image from "next/image";
import Link from "next/link";
import AddToBasket from "./AddToBasket";
import { formatMoney, parseList, netCarbs } from "@/lib/utils";

export type DessertCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  priceCents: number;
  unitLabel: string;
  imageUrl: string | null;
  imageAlt: string | null;
  badges: string;
  leadTimeDays: number;
  isAvailable: boolean;
  totalCarbsG: number | null;
  fiberG: number | null;
  sugarAlcoholG: number | null;
  addedSugarsG: number | null;
};

export default function DessertCard({
  dessert,
  priority = false,
}: {
  dessert: DessertCardData;
  priority?: boolean;
}) {
  const badges = parseList(dessert.badges).slice(0, 3);
  const net = netCarbs(
    dessert.totalCarbsG,
    dessert.fiberG,
    dessert.sugarAlcoholG,
  );

  return (
    <article className="card-plinth group relative flex flex-col overflow-hidden rounded-[1.75rem]">
      <Link
        href={`/gallery/${dessert.slug}`}
        className="relative block aspect-4/5 overflow-hidden"
      >
        {dessert.imageUrl ? (
          <Image
            src={dessert.imageUrl}
            alt={dessert.imageAlt ?? dessert.name}
            fill
            sizes="(min-width: 1280px) 24rem, (min-width: 768px) 33vw, 90vw"
            priority={priority}
            className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cloud to-cloud-2" />
        )}

        {/* A halo of light that blooms on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-plum/45 via-transparent to-transparent opacity-70 transition-opacity duration-700 group-hover:opacity-40" />

        {dessert.addedSugarsG === 0 && (
          <span className="placard absolute left-4 top-4 rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-plum">
            0 g added sugar
          </span>
        )}

        {!dessert.isAvailable && (
          <span className="absolute inset-x-0 bottom-0 bg-plum/85 py-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white">
            Resting this season
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span key={badge} className="badge">
              {badge}
            </span>
          ))}
        </div>

        <h3 className="text-2xl leading-tight">
          <Link
            href={`/gallery/${dessert.slug}`}
            className="transition-colors hover:text-berry"
          >
            {dessert.name}
          </Link>
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
          {dessert.tagline}
        </p>

        <dl className="mt-5 flex items-end justify-between border-t border-blush/60 pt-4">
          <div>
            <dt className="sr-only">Price</dt>
            <dd className="text-xl text-berry">
              {formatMoney(dessert.priceCents)}
              <span className="ml-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-ink-faint">
                {dessert.unitLabel}
              </span>
            </dd>
          </div>
          {net != null && (
            <div className="text-right">
              <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-ink-faint">
                Net carbs
              </dt>
              <dd className="text-sm font-medium text-plum">{net} g</dd>
            </div>
          )}
        </dl>

        {dessert.isAvailable && (
          <div className="mt-5">
            <AddToBasket
              line={{
                dessertId: dessert.id,
                slug: dessert.slug,
                name: dessert.name,
                priceCents: dessert.priceCents,
                imageUrl: dessert.imageUrl,
                unitLabel: dessert.unitLabel,
                leadTimeDays: dessert.leadTimeDays,
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
