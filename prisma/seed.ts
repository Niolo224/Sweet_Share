/**
 * Seeds Sweet Share with the opening collection.
 *
 *   npm run db:seed
 *
 * This file is the source of truth for the menu. Desserts and pantry entries
 * are upserted by slug, and anything no longer listed here is removed — so
 * trimming the menu is a matter of editing the arrays below and re-running.
 *
 * Orders, reviews and subscribers are never touched.
 */
import { PrismaClient } from "@prisma/client";
import registry from "../src/lib/media.json";

const prisma = new PrismaClient();

const cdn = (key: keyof typeof registry.assets) =>
  `${registry.cdn}/${registry.assets[key].remote}`;
const alt = (key: keyof typeof registry.assets) => registry.assets[key].alt;

const desserts = [
  {
    slug: "chocolate-chip-cookies",
    name: "The Everyday Chocolate Chip Cookie",
    tagline: "The one that started the whole thing",
    description:
      "Crisp at the edge, soft in the middle, pooled with dark chocolate. No butter, no eggs, no refined sugar, and absolutely no apology.",
    story:
      "We rebuilt this recipe forty-one times. The forty-first is the one where our son stopped asking for the 'normal' kind.",
    category: "cookies",
    priceCents: 1600,
    unitLabel: "box of 6",
    imageKey: "chocolateChipCookies" as const,
    ingredients: [
      { name: "Almond flour" },
      { name: "Oat flour", note: "certified gluten-free" },
      { name: "Cashew butter" },
      { name: "Allulose" },
      { name: "Monk fruit extract" },
      { name: "70% dark chocolate", note: "dairy-free, monk-fruit sweetened" },
      { name: "Ground flaxseed", note: "our egg" },
      { name: "Vanilla bean" },
      { name: "Baking soda" },
      { name: "Flaky sea salt" },
    ],
    allergens: ["tree nuts (almond, cashew)"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 cookie (48 g)",
    calories: 178,
    totalCarbsG: 14.2,
    fiberG: 3.1,
    sugarsG: 2.4,
    addedSugarsG: 0,
    sugarAlcoholG: 5.8,
    proteinG: 4.8,
    fatG: 12.6,
    satFatG: 3.2,
    sodiumMg: 104,
    sweetener: "Allulose and monk fruit",
    glycemicLoad: 2.6,
    glycemicNote:
      "Net carbs sit near five grams. This is the cookie we hand to people the day they are diagnosed.",
    leadTimeDays: 1,
    servesText: "6 cookies",
    scripture: "Do not neglect to do good and to share what you have.",
    scriptureRef: "Hebrews 13:16",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "cashew-cheesecake",
    name: "The Cloud Cheesecake",
    tagline: "Dense, cool and impossibly creamy — without a drop of dairy",
    description:
      "Cashews soaked overnight, blended with coconut cream and lemon until silky, set on a golden oat-almond crust and swirled with berry compote. It slices like a New York cheesecake and nobody believes there is no cream cheese in it.",
    story:
      "This one took the longest. Cheesecake is the dessert people miss most when dairy comes off the table — it is what they name first, every time. We were not willing to serve a mousse and call it cheesecake, so we kept going until it had the proper weight and the proper tang. Soaked cashews and lemon do what culture and cream used to.",
    category: "cakes",
    priceCents: 4600,
    unitLabel: "8-inch cheesecake",
    imageKey: "cashewCheesecake" as const,
    ingredients: [
      { name: "Raw cashews", note: "soaked overnight — the whole secret" },
      { name: "Coconut cream", note: "full fat" },
      { name: "Fresh lemon juice", note: "for the tang cream cheese used to give" },
      { name: "Rolled oats", note: "certified gluten-free, for the crust" },
      { name: "Almond flour" },
      { name: "Medjool dates", note: "binding the crust" },
      { name: "Allulose" },
      { name: "Monk fruit extract" },
      { name: "Coconut oil" },
      { name: "Vanilla bean" },
      { name: "Mixed berries", note: "cooked down, no added sugar" },
      { name: "Sea salt" },
    ],
    allergens: ["tree nuts (cashew, almond)", "coconut"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 slice (1/12 cake, 92 g)",
    calories: 268,
    totalCarbsG: 16.2,
    fiberG: 2.4,
    sugarsG: 4.2,
    addedSugarsG: 0,
    sugarAlcoholG: 5.4,
    proteinG: 6.8,
    fatG: 21.4,
    satFatG: 7.2,
    sodiumMg: 128,
    sweetener: "Allulose, monk fruit and a little date in the crust",
    glycemicLoad: 3.8,
    glycemicNote:
      "Cashews and coconut make this a rich, fat-dense slice, which is exactly why it lands so gently — net carbs come in around eight grams. It is filling, so a modest slice genuinely satisfies.",
    leadTimeDays: 3,
    servesText: "Serves 12",
    scripture: "Taste and see that the Lord is good.",
    scriptureRef: "Psalm 34:8",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    slug: "double-chocolate-cookies",
    name: "Double Chocolate Sea Salt Cookie",
    tagline: "Fudgy, crackle-topped, and darker than it has any right to be",
    description:
      "Raw cacao worked all the way through the dough, with molten dark chocolate chunks and flaky sea salt across the top. Deep and almost brownie-like — the one for people who think they do not like healthy desserts.",
    story:
      "The chocolate chip cookie converts the sceptics. This one is for the people who were never sceptical, just greedy. It has the most fibre of anything we make, which nobody notices and we quite enjoy.",
    category: "cookies",
    priceCents: 1800,
    unitLabel: "box of 6",
    imageKey: "doubleChocolateCookies" as const,
    ingredients: [
      { name: "Almond flour" },
      { name: "Raw cacao powder", note: "unsweetened, 100%" },
      { name: "Oat flour", note: "certified gluten-free" },
      { name: "Cashew butter" },
      { name: "Allulose" },
      { name: "Monk fruit extract" },
      { name: "70% dark chocolate", note: "dairy-free, monk-fruit sweetened" },
      { name: "Ground flaxseed", note: "our egg" },
      { name: "Vanilla bean" },
      { name: "Baking soda" },
      { name: "Flaky sea salt" },
    ],
    allergens: ["tree nuts (almond, cashew)"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 cookie (48 g)",
    calories: 186,
    totalCarbsG: 15.1,
    fiberG: 4.2,
    sugarsG: 2.1,
    addedSugarsG: 0,
    sugarAlcoholG: 6.1,
    proteinG: 5.1,
    fatG: 13.2,
    satFatG: 3.8,
    sodiumMg: 112,
    sweetener: "Allulose and monk fruit",
    glycemicLoad: 2.2,
    glycemicNote:
      "Unsweetened cacao carries no sugar of its own, and it pushes the fibre higher than our other cookie. Net carbs land under five grams — the gentlest thing on the menu.",
    leadTimeDays: 1,
    servesText: "6 cookies",
    scripture: "You have put more joy in my heart than they have when their grain and wine abound.",
    scriptureRef: "Psalm 4:7",
    isFeatured: true,
    sortOrder: 3,
  },
];

const ingredients = [
  {
    slug: "raw-cashews",
    name: "Raw cashews",
    kind: "nut",
    summary:
      "Soaked overnight and blended until completely smooth. This is what makes a cheesecake without cream cheese possible.",
    benefits:
      "Mostly monounsaturated fat with a good amount of protein and very little available carbohydrate. The fat is also what slows the whole slice down.",
    glycemicIndex: 22,
    sortOrder: 1,
  },
  {
    slug: "almond-flour",
    name: "Almond flour",
    kind: "flour",
    summary:
      "Blanched almonds, finely ground. The backbone of every cookie and crust we make.",
    benefits:
      "High in protein, fat and fibre, low in available carbohydrate. It flattens the glycemic curve of everything it is baked into.",
    glycemicIndex: 0,
    sortOrder: 2,
  },
  {
    slug: "oat-flour",
    name: "Oat flour",
    kind: "flour",
    summary:
      "Certified gluten-free rolled oats, milled fresh. It gives tenderness where almond alone would be dense.",
    benefits:
      "Rich in beta-glucan, a soluble fibre with real evidence behind it for cholesterol and post-meal glucose.",
    glycemicIndex: 55,
    sortOrder: 3,
  },
  {
    slug: "allulose",
    name: "Allulose",
    kind: "sweetener",
    summary:
      "A rare sugar found naturally in figs and raisins. It browns, caramelises and behaves like sugar in the oven.",
    benefits:
      "Roughly 70% as sweet as sugar, but the body absorbs it without metabolising it for energy. Studies show essentially no rise in blood glucose or insulin.",
    glycemicIndex: 0,
    sortOrder: 4,
  },
  {
    slug: "monk-fruit",
    name: "Monk fruit",
    kind: "sweetener",
    summary:
      "A small melon from southern China, up to 200 times sweeter than sugar, used in tiny amounts.",
    benefits:
      "Zero glycemic impact and zero calories. The sweetness comes from mogrosides, which the body does not process as sugar at all.",
    glycemicIndex: 0,
    sortOrder: 5,
  },
  {
    slug: "medjool-dates",
    name: "Medjool dates",
    kind: "sweetener",
    summary:
      "Whole dried fruit, blended into a caramel paste. We use them to bind the cheesecake crust.",
    benefits:
      "Because the fruit stays whole, its fibre comes along for the ride — which is precisely what slows the sugar down. A date is not the same thing as the sugar extracted from it.",
    glycemicIndex: 42,
    sortOrder: 6,
  },
  {
    slug: "ground-flaxseed",
    name: "Ground flaxseed",
    kind: "binder",
    summary:
      "Mixed with water it forms a gel that behaves remarkably like egg. This is how our cookies hold together.",
    benefits:
      "Omega-3 fats, lignans and a lot of soluble fibre. It does a job an egg cannot: it adds fibre rather than cholesterol.",
    glycemicIndex: 0,
    sortOrder: 7,
  },
  {
    slug: "coconut-cream",
    name: "Coconut cream",
    kind: "fat",
    summary:
      "Full-fat and unsweetened. It sets firm when chilled, which is what gives the cheesecake its slice.",
    benefits:
      "Naturally free of lactose and casein, and its fat slows gastric emptying — which is a technical way of saying dessert lands softer.",
    glycemicIndex: null,
    sortOrder: 8,
  },
  {
    slug: "raw-cacao",
    name: "Raw cacao",
    kind: "spice",
    summary:
      "Cold-pressed, unsweetened, unalkalised. Far more bitter and far more alive than cocoa powder.",
    benefits:
      "One of the densest sources of flavanols we know of, with good evidence for blood vessel function. Unsweetened, it carries no sugar at all.",
    glycemicIndex: null,
    sortOrder: 9,
  },
  {
    slug: "vanilla-bean",
    name: "Vanilla bean",
    kind: "spice",
    summary:
      "Whole pods, scraped. Expensive, slow, and worth it — we have never once used the imitation kind.",
    benefits:
      "No sugar and no calories, but the brain reads vanilla as sweetness, which lets us use less sweetener than we otherwise would.",
    glycemicIndex: null,
    sortOrder: 10,
  },
];

const reviews = [
  {
    name: "Marcy T.",
    location: "Riverside",
    rating: 5,
    title: "I cried a little",
    body: "I was diagnosed with type 2 in March and I had made peace with never having cheesecake again. My daughter ordered one for my birthday. I checked my sugar an hour after and it barely moved. I have not stopped telling people.",
    dessertSlug: "cashew-cheesecake",
    isFeatured: true,
    isVerified: true,
  },
  {
    name: "Pastor Alan R.",
    location: "Grace Fellowship",
    rating: 5,
    title: "Fed ninety people, offended nobody",
    body: "We have vegans, celiacs, two diabetics and a child with a severe egg allergy in our congregation. Sweet Share catered our anniversary lunch and for the first time in my ministry every single person ate the same dessert. That is not a small thing.",
    dessertSlug: null,
    isFeatured: true,
    isVerified: true,
  },
  {
    name: "Denise K.",
    location: "Oakhill",
    rating: 5,
    title: "The cookies are unreasonable",
    body: "I bought these expecting a health-food cookie. They are just a great cookie. My husband ate four before I told him what was not in them and he refused to believe me.",
    dessertSlug: "chocolate-chip-cookies",
    isFeatured: true,
    isVerified: true,
  },
  {
    name: "Ify O.",
    location: "Downtown",
    rating: 5,
    title: "Cheesecake at our wedding",
    body: "It was the most photographed thing on the dessert table, including the bride. Three separate guests asked me where the bakery was before the night was over.",
    dessertSlug: "cashew-cheesecake",
    isFeatured: true,
    isVerified: true,
  },
  {
    name: "Sam W.",
    location: "Northside",
    rating: 4,
    title: "Genuinely good, plan ahead",
    body: "The double chocolate ones are outstanding and my kids have no idea they are eating something good for them. Only note is that the cheesecake needs a few days' notice — but honestly that is why it tastes made-to-order, so I have made my peace.",
    dessertSlug: "double-chocolate-cookies",
    isFeatured: false,
    isVerified: true,
  },
  {
    name: "Ruth and Elena",
    location: "Westbrook",
    rating: 5,
    title: "They did what we could not",
    body: "Our friend lost her mother and we had no words at all. We sent a box of cookies. She told us later she sat on the kitchen floor and ate one and felt held. Thank you for building a business around that.",
    dessertSlug: "chocolate-chip-cookies",
    isFeatured: true,
    isVerified: true,
  },
];

function daysFromNow(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Setting the table…\n");

  // ── Desserts ──────────────────────────────────────────────
  const dessertRecords: Record<string, string> = {};
  for (const item of desserts) {
    const { imageKey, ingredients: lines, allergens, badges, ...rest } = item;
    const data = {
      ...rest,
      imageUrl: cdn(imageKey),
      imageAlt: alt(imageKey),
      ingredients: JSON.stringify(lines),
      allergens: JSON.stringify(allergens),
      badges: JSON.stringify(badges),
    };
    const record = await prisma.dessert.upsert({
      where: { slug: item.slug },
      create: data,
      update: data,
    });
    dessertRecords[item.slug] = record.id;
    console.log(`  ✓ ${item.name}`);
  }

  // This file is the menu. Anything not in it no longer belongs on the site.
  const removedDesserts = await prisma.dessert.deleteMany({
    where: { slug: { notIn: desserts.map((d) => d.slug) } },
  });
  if (removedDesserts.count > 0) {
    console.log(`  · removed ${removedDesserts.count} dessert(s) no longer on the menu`);
  }

  // ── Pantry glossary ───────────────────────────────────────
  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { slug: ingredient.slug },
      create: ingredient,
      update: ingredient,
    });
  }
  await prisma.ingredient.deleteMany({
    where: { slug: { notIn: ingredients.map((i) => i.slug) } },
  });
  console.log(`\n  ✓ ${ingredients.length} pantry entries`);

  // ── The opening menu ──────────────────────────────────────
  const menu = await prisma.menu.upsert({
    where: { slug: "the-opening-collection" },
    create: {
      slug: "the-opening-collection",
      title: "The Opening Collection",
      subtitle: "Three things, done properly",
      description:
        "Our founding menu. Two cookies and a cheesecake — none of them containing dairy, eggs or refined sugar, every one of them built so that nobody at your table has to sit the dessert course out. We would rather do three things well than twelve things adequately.",
      season: "Everyday",
      coverImageUrl: cdn("hero"),
      isActive: true,
    },
    update: {
      subtitle: "Three things, done properly",
      isActive: true,
      coverImageUrl: cdn("hero"),
    },
  });

  await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
  await prisma.menuItem.createMany({
    data: desserts.map((item, index) => ({
      menuId: menu.id,
      dessertId: dessertRecords[item.slug],
      sortOrder: index,
    })),
  });
  console.log("  ✓ The Opening Collection menu");

  // ── Gatherings ────────────────────────────────────────────
  const events = [
    {
      slug: "sunday-tasting-table",
      title: "The Sunday Tasting Table",
      description:
        "Come and taste everything on the menu, meet the people who bake it, and ask every question you have about baking without sugar. Free, and everyone is welcome — bring someone who thinks they cannot eat dessert any more.",
      startsAt: daysFromNow(12, 14),
      endsAt: daysFromNow(12, 17),
      location: "The Sweet Share Kitchen",
      address: "Address shared on RSVP",
      imageUrl: cdn("gathering"),
      capacity: 40,
      priceCents: 0,
    },
    {
      slug: "baking-without-sugar-workshop",
      title: "Baking Without Sugar — a hands-on workshop",
      description:
        "Three hours, small group. We will make the everyday cookie and the cheesecake together, and you will leave understanding allulose, monk fruit, soaked cashews and flax eggs well enough to bake without us. Includes everything you make.",
      startsAt: daysFromNow(26, 10),
      endsAt: daysFromNow(26, 13),
      location: "The Sweet Share Kitchen",
      address: "Address shared on RSVP",
      imageUrl: cdn("pantry"),
      capacity: 12,
      priceCents: 6500,
    },
    {
      slug: "the-long-table-supper",
      title: "The Long Table Supper",
      description:
        "One long table, one dessert course, and a room full of people who have never met. We put the boxes on the table and see what happens. Proceeds fund the boxes we give away.",
      startsAt: daysFromNow(40, 18),
      endsAt: daysFromNow(40, 21),
      location: "Grace Fellowship Hall",
      address: "Address shared on RSVP",
      imageUrl: cdn("gathering"),
      capacity: 60,
      priceCents: 2500,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      create: event,
      update: event,
    });
  }
  console.log(`  ✓ ${events.length} gatherings`);

  // ── Kind words ────────────────────────────────────────────
  const existingReviews = await prisma.review.count();
  if (existingReviews === 0) {
    for (const review of reviews) {
      const { dessertSlug, ...rest } = review;
      await prisma.review.create({
        data: {
          ...rest,
          status: "approved",
          dessertId: dessertSlug ? dessertRecords[dessertSlug] : null,
        },
      });
    }
    console.log(`  ✓ ${reviews.length} testimonials`);
  } else {
    console.log(`  · ${existingReviews} testimonials already present — left alone`);
  }

  // ── Editable copy ─────────────────────────────────────────
  const settings: Record<string, string> = {
    storyTitle: "Our story",
    contactEmail: "hello@sweetshare.com",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }

  console.log("\nThe table is set. Run `npm run dev` and come see.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
