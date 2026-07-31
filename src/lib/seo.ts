import { parseList, netCarbs, type IngredientLine } from "./utils";

/**
 * Structured data.
 *
 * This is the highest-leverage thing on the site for being *found*, and it
 * matters twice over for a business like this one.
 *
 * Search engines use it for rich results. Answer engines — ChatGPT, Perplexity,
 * Google's AI Overviews, Claude — use it because it turns prose into facts they
 * can quote with confidence. When somebody asks an assistant "where can I get a
 * dessert that won't spike my blood sugar", the thing that gets us into the
 * answer is machine-readable nutrition, not adjectives.
 *
 * So every dessert publishes a full NutritionInformation block. It is the same
 * data already shown on the page, stated in a form a machine cannot misread.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sweetshare.shop"
).replace(/\/$/, "");

export const BRAND = {
  name: "Sweet Share",
  legalName: "Sweet Share",
  description:
    "Plant-based, diabetes-friendly desserts baked without dairy, eggs or refined sugar. Order ahead for gatherings, celebrations and ordinary Tuesdays.",
  slogan: "Made to be shared.",
};

export function absolute(path = "") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type DessertForSchema = {
  slug: string;
  name: string;
  description: string;
  tagline: string;
  priceCents: number;
  unitLabel: string;
  imageUrl: string | null;
  isAvailable: boolean;
  ingredients: string;
  allergens: string;
  badges: string;
  servingSize: string | null;
  calories: number | null;
  totalCarbsG: number | null;
  fiberG: number | null;
  sugarsG: number | null;
  proteinG: number | null;
  fatG: number | null;
  satFatG: number | null;
  sodiumMg: number | null;
  sugarAlcoholG: number | null;
};

/** schema.org/Product, with the nutrition panel machines can actually read. */
export function dessertSchema(
  dessert: DessertForSchema,
  reviews: { rating: number; body: string; name: string; createdAt: Date }[] = [],
) {
  const ingredients = parseList<IngredientLine>(dessert.ingredients);
  const allergens = parseList(dessert.allergens);
  const badges = parseList(dessert.badges);
  const net = netCarbs(dessert.totalCarbsG, dessert.fiberG, dessert.sugarAlcoholG);

  const nutrition: Record<string, string> = {};
  if (dessert.servingSize) nutrition.servingSize = dessert.servingSize;
  if (dessert.calories != null) nutrition.calories = `${dessert.calories} calories`;
  if (dessert.totalCarbsG != null)
    nutrition.carbohydrateContent = `${dessert.totalCarbsG} g`;
  if (dessert.fiberG != null) nutrition.fiberContent = `${dessert.fiberG} g`;
  if (dessert.sugarsG != null) nutrition.sugarContent = `${dessert.sugarsG} g`;
  if (dessert.proteinG != null) nutrition.proteinContent = `${dessert.proteinG} g`;
  if (dessert.fatG != null) nutrition.fatContent = `${dessert.fatG} g`;
  if (dessert.satFatG != null)
    nutrition.saturatedFatContent = `${dessert.satFatG} g`;
  if (dessert.sodiumMg != null) nutrition.sodiumContent = `${dessert.sodiumMg} mg`;

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absolute(`/gallery/${dessert.slug}#product`),
    name: dessert.name,
    description: dessert.description,
    image: dessert.imageUrl ? [dessert.imageUrl] : undefined,
    brand: { "@type": "Brand", name: BRAND.name },
    category: "Dessert",
    url: absolute(`/gallery/${dessert.slug}`),
    // The claims people actually search for, as machine-readable properties.
    additionalProperty: [
      { "@type": "PropertyValue", name: "Dietary", value: badges.join(", ") },
      { "@type": "PropertyValue", name: "Contains dairy", value: "No" },
      { "@type": "PropertyValue", name: "Contains eggs", value: "No" },
      { "@type": "PropertyValue", name: "Refined sugar", value: "None" },
      ...(net != null
        ? [
            {
              "@type": "PropertyValue",
              name: "Net carbohydrates per serving",
              value: `${net} g`,
            },
          ]
        : []),
      ...(allergens.length > 0
        ? [
            {
              "@type": "PropertyValue",
              name: "Allergens",
              value: allergens.join(", "),
            },
          ]
        : []),
    ],
    nutrition:
      Object.keys(nutrition).length > 0
        ? { "@type": "NutritionInformation", ...nutrition }
        : undefined,
    ...(ingredients.length > 0
      ? { material: ingredients.map((i) => i.name) }
      : {}),
    offers: {
      "@type": "Offer",
      url: absolute(`/gallery/${dessert.slug}`),
      price: (dessert.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: dessert.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: BRAND.name },
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        unitText: dessert.unitLabel,
      },
    },
    ...(average != null && reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: average.toFixed(1),
            reviewCount: reviews.length,
            bestRating: "5",
            worstRating: "1",
          },
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: String(r.rating),
              bestRating: "5",
            },
            author: { "@type": "Person", name: r.name },
            reviewBody: r.body,
            datePublished: r.createdAt.toISOString().slice(0, 10),
          })),
        }
      : {}),
  };
}

export function organisationSchema(contactEmail?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": absolute("/#organization"),
    name: BRAND.name,
    legalName: BRAND.legalName,
    description: BRAND.description,
    slogan: BRAND.slogan,
    url: SITE_URL,
    image: absolute("/opengraph-image"),
    logo: absolute("/icon"),
    email: contactEmail || undefined,
    priceRange: "$$",
    servesCuisine: ["Vegan", "Plant-based", "Desserts"],
    // These are exactly the filters a person or an assistant searches on.
    hasMenu: absolute("/gallery"),
    knowsAbout: [
      "vegan baking",
      "diabetes-friendly desserts",
      "dairy-free desserts",
      "egg-free baking",
      "sugar-free desserts",
      "allulose",
      "monk fruit",
      "low glycemic desserts",
    ],
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Advance dessert orders, catering and monthly subscription boxes",
      },
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function itemListSchema(
  desserts: { slug: string; name: string }[],
  path: string,
  name: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": absolute(`${path}#list`),
    name,
    numberOfItems: desserts.length,
    itemListElement: desserts.map((dessert, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absolute(`/gallery/${dessert.slug}`),
      name: dessert.name,
    })),
  };
}

export function eventSchema(event: {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string;
  imageUrl: string | null;
  priceCents: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt?.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.imageUrl ?? undefined,
    url: absolute(`/gatherings#${event.slug}`),
    location: { "@type": "Place", name: event.location },
    organizer: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: ((event.priceCents ?? 0) / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absolute("/gatherings"),
    },
  };
}
