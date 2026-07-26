/**
 * Seeds Sweet Share with a full opening collection.
 *
 *   npm run db:seed
 *
 * Everything here is upserted by slug, so running it twice is safe and will
 * not duplicate or clobber orders, reviews or subscribers.
 */
import { PrismaClient } from "@prisma/client";
import registry from "../src/lib/media.json";

const prisma = new PrismaClient();

const cdn = (key: keyof typeof registry.assets) =>
  `${registry.cdn}/${registry.assets[key].remote}`;
const alt = (key: keyof typeof registry.assets) => registry.assets[key].alt;

const desserts = [
  {
    slug: "chocolate-date-torte",
    name: "Chocolate & Date Torte",
    tagline: "Deep, dark and sweetened only by fruit",
    description:
      "A flourless torte built on medjool dates and raw cacao, finished with a coconut-cream ganache and fresh figs. Rich enough that a small slice is plenty — which is exactly the point.",
    story:
      "This was the first thing we ever baked for someone else. A neighbour had just been told to bring her blood sugar down, and she cried in her kitchen because she thought birthdays were over for her. We spent a month on this torte. She had a slice, checked her numbers an hour later, and laughed out loud. It has been on every menu since.",
    category: "cakes",
    priceCents: 4200,
    unitLabel: "6-inch torte",
    imageKey: "chocolateDateTorte" as const,
    ingredients: [
      { name: "Medjool dates", note: "our only sweetener here" },
      { name: "Raw cacao powder", note: "unsweetened, 100%" },
      { name: "Almond flour" },
      { name: "Coconut cream", note: "full fat, for the ganache" },
      { name: "70% dark chocolate", note: "dairy-free, sweetened with monk fruit" },
      { name: "Ground flaxseed", note: "our egg" },
      { name: "Cold-pressed coconut oil" },
      { name: "Vanilla bean" },
      { name: "Sea salt" },
      { name: "Fresh black mission figs" },
    ],
    allergens: ["tree nuts (almond)", "coconut"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 slice (1/10 torte, 62 g)",
    calories: 218,
    totalCarbsG: 21.4,
    fiberG: 5.8,
    sugarsG: 12.9,
    addedSugarsG: 0,
    sugarAlcoholG: 0,
    proteinG: 4.6,
    fatG: 14.2,
    satFatG: 6.1,
    sodiumMg: 62,
    sweetener: "Medjool dates and monk fruit",
    glycemicLoad: 7.2,
    glycemicNote:
      "The fibre in the dates and the fat in the almonds slow everything down. Most guests tell us this one behaves like a handful of nuts, not a dessert.",
    leadTimeDays: 3,
    servesText: "Serves 10 generously",
    scripture: "He satisfies the thirsty and fills the hungry with good things.",
    scriptureRef: "Psalm 107:9",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "lemon-olive-oil-cake",
    name: "Lemon & Olive Oil Cake",
    tagline: "Bright, tender, and lighter than it looks",
    description:
      "Cold-pressed olive oil gives this cake a crumb so tender nobody believes there is no butter or egg in it. Topped with blueberries, candied lemon and a cashew-cream drizzle.",
    story:
      "Made for the woman in our church who brings soup to everyone else and never lets anyone bring her anything. She likes lemon. This is her cake.",
    category: "cakes",
    priceCents: 3800,
    unitLabel: "8-inch cake",
    imageKey: "lemonOliveOilCake" as const,
    ingredients: [
      { name: "Almond flour" },
      { name: "Oat flour", note: "certified gluten-free" },
      { name: "Extra-virgin olive oil", note: "cold pressed" },
      { name: "Fresh lemon juice and zest" },
      { name: "Allulose", note: "does not raise blood glucose" },
      { name: "Monk fruit extract" },
      { name: "Unsweetened almond milk" },
      { name: "Apple cider vinegar", note: "with baking soda, for lift" },
      { name: "Ground flaxseed" },
      { name: "Raw cashews", note: "soaked, for the drizzle" },
      { name: "Fresh blueberries" },
    ],
    allergens: ["tree nuts (almond, cashew)"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 slice (1/12 cake, 74 g)",
    calories: 196,
    totalCarbsG: 16.8,
    fiberG: 3.4,
    sugarsG: 4.1,
    addedSugarsG: 0,
    sugarAlcoholG: 6.2,
    proteinG: 5.2,
    fatG: 13.8,
    satFatG: 1.9,
    sodiumMg: 118,
    sweetener: "Allulose and monk fruit",
    glycemicLoad: 3.1,
    glycemicNote:
      "Allulose is a rare sugar the body does not metabolise for energy, so it lands almost flat. This is our gentlest cake.",
    leadTimeDays: 2,
    servesText: "Serves 12",
    scripture: "You have put more joy in my heart than they have when their grain and wine abound.",
    scriptureRef: "Psalm 4:7",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    slug: "pistachio-rose-tart",
    name: "Pistachio, Rose & Cardamom Tart",
    tagline: "The one people photograph before they eat it",
    description:
      "A golden oat-almond crust holding silky cashew-and-coconut pistachio cream, crowned with crushed pistachios, dried rose petals and pomegranate seeds.",
    story:
      "Our most requested wedding dessert. It tastes like somewhere warm and far away, and it happens to be the kindest thing on the menu for anyone watching their sugar.",
    category: "tarts",
    priceCents: 4800,
    unitLabel: "9-inch tart",
    imageKey: "pistachioRoseTart" as const,
    ingredients: [
      { name: "Raw pistachios" },
      { name: "Raw cashews", note: "soaked overnight" },
      { name: "Rolled oats", note: "certified gluten-free" },
      { name: "Almond flour" },
      { name: "Coconut cream" },
      { name: "Coconut oil" },
      { name: "Monk fruit extract" },
      { name: "Ground cardamom" },
      { name: "Food-grade rose water" },
      { name: "Dried rose petals" },
      { name: "Fresh pomegranate seeds" },
      { name: "Sea salt" },
    ],
    allergens: ["tree nuts (pistachio, cashew, almond)", "coconut"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly", "raw crust"],
    servingSize: "1 slice (1/12 tart, 68 g)",
    calories: 241,
    totalCarbsG: 15.2,
    fiberG: 3.9,
    sugarsG: 3.6,
    addedSugarsG: 0,
    sugarAlcoholG: 0,
    proteinG: 6.4,
    fatG: 19.1,
    satFatG: 7.4,
    sodiumMg: 74,
    sweetener: "Monk fruit",
    glycemicLoad: 4.4,
    glycemicNote:
      "Nut-dense and sweetened only with monk fruit. The fat and protein blunt the curve almost completely.",
    leadTimeDays: 3,
    servesText: "Serves 12",
    scripture: "How sweet are your words to my taste, sweeter than honey to my mouth!",
    scriptureRef: "Psalm 119:103",
    isFeatured: true,
    sortOrder: 3,
  },
  {
    slug: "chocolate-avocado-mousse",
    name: "Chocolate Avocado Mousse",
    tagline: "Three jars, no dairy, no compromise",
    description:
      "Silky dark chocolate mousse whipped from ripe avocado and coconut cream, topped with raspberries and a cloud of coconut whip. Nobody has ever guessed the avocado.",
    story:
      "We serve this to sceptics. It is the fastest way we know to prove that 'healthy dessert' is not a consolation prize.",
    category: "puddings",
    priceCents: 2400,
    unitLabel: "set of 3 jars",
    imageKey: "chocolateAvocadoMousse" as const,
    ingredients: [
      { name: "Ripe avocado" },
      { name: "Raw cacao powder" },
      { name: "Coconut cream" },
      { name: "Monk fruit extract" },
      { name: "Medjool dates", note: "just two, for body" },
      { name: "Vanilla bean" },
      { name: "Sea salt" },
      { name: "Fresh raspberries" },
      { name: "Dark chocolate shavings", note: "dairy-free" },
    ],
    allergens: ["coconut"],
    badges: ["vegan", "gluten-free", "nut-free", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 jar (110 g)",
    calories: 184,
    totalCarbsG: 17.6,
    fiberG: 7.2,
    sugarsG: 6.8,
    addedSugarsG: 0,
    sugarAlcoholG: 0,
    proteinG: 3.1,
    fatG: 13.4,
    satFatG: 6.8,
    sodiumMg: 48,
    sweetener: "Monk fruit with a little date",
    glycemicLoad: 4.8,
    glycemicNote:
      "Over seven grams of fibre per jar. Net carbs land around ten — one of the gentlest desserts we make, and the only nut-free one.",
    leadTimeDays: 2,
    servesText: "3 jars",
    scripture: "The Lord is my shepherd; I shall not want.",
    scriptureRef: "Psalm 23:1",
    isFeatured: false,
    sortOrder: 4,
  },
  {
    slug: "cinnamon-apple-hand-pies",
    name: "Cinnamon Apple Hand Pies",
    tagline: "Autumn you can hold in one hand",
    description:
      "Flaky olive-oil spelt pastry folded around slow-cooked cinnamon apples. No sugar goes into the filling at all — the apples do the work.",
    story:
      "Baked every week for the after-school table. Children have no idea they are eating something good for them, which is how we like it.",
    category: "pastries",
    priceCents: 1800,
    unitLabel: "box of 4",
    imageKey: "cinnamonAppleHandPies" as const,
    ingredients: [
      { name: "Spelt flour" },
      { name: "Extra-virgin olive oil" },
      { name: "Honeycrisp apples", note: "slow cooked, no added sugar" },
      { name: "Ceylon cinnamon" },
      { name: "Ground nutmeg" },
      { name: "Lemon juice" },
      { name: "Allulose", note: "a little, in the pastry only" },
      { name: "Unsweetened almond milk", note: "for the wash" },
      { name: "Sea salt" },
    ],
    allergens: ["gluten (spelt)", "tree nuts (almond)"],
    badges: ["vegan", "no refined sugar", "diabetes-friendly"],
    servingSize: "1 hand pie (86 g)",
    calories: 212,
    totalCarbsG: 28.4,
    fiberG: 4.6,
    sugarsG: 9.2,
    addedSugarsG: 0,
    sugarAlcoholG: 3.1,
    proteinG: 4.2,
    fatG: 9.8,
    satFatG: 1.4,
    sodiumMg: 96,
    sweetener: "The apples themselves, plus a little allulose",
    glycemicLoad: 9.6,
    glycemicNote:
      "Spelt is a whole grain and the apples keep their skins, so the fibre is high. Still the carbiest thing we make — pair it with something with protein.",
    leadTimeDays: 2,
    servesText: "4 hand pies",
    scripture: "Give us this day our daily bread.",
    scriptureRef: "Matthew 6:11",
    isFeatured: false,
    sortOrder: 5,
  },
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
      { name: "Ground flaxseed" },
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
    sortOrder: 6,
  },
  {
    slug: "banana-walnut-bread",
    name: "Banana Walnut Bread",
    tagline: "Sweetened by nothing but fruit",
    description:
      "Overripe bananas and medjool dates carry the whole loaf. Studded with toasted walnuts, moist for days, and honest enough for breakfast.",
    story:
      "The loaf we bring when someone is grieving. It says what we cannot.",
    category: "breads",
    priceCents: 2600,
    unitLabel: "1 loaf",
    imageKey: "bananaWalnutBread" as const,
    ingredients: [
      { name: "Overripe bananas", note: "the only real sweetness" },
      { name: "Medjool dates" },
      { name: "Oat flour", note: "certified gluten-free" },
      { name: "Almond flour" },
      { name: "Toasted walnuts" },
      { name: "Ground flaxseed" },
      { name: "Cold-pressed coconut oil" },
      { name: "Ceylon cinnamon" },
      { name: "Baking soda" },
      { name: "Sea salt" },
    ],
    allergens: ["tree nuts (walnut, almond)", "coconut"],
    badges: ["vegan", "gluten-free", "no refined sugar", "fruit sweetened"],
    servingSize: "1 slice (1/10 loaf, 72 g)",
    calories: 204,
    totalCarbsG: 24.1,
    fiberG: 4.4,
    sugarsG: 11.8,
    addedSugarsG: 0,
    sugarAlcoholG: 0,
    proteinG: 5.1,
    fatG: 11.2,
    satFatG: 3.1,
    sodiumMg: 138,
    sweetener: "Banana and dates only",
    glycemicLoad: 10.4,
    glycemicNote:
      "Fruit-sweetened rather than sugar-free, so this one carries more natural sugar. Still whole-food, still high fibre — but if you are counting closely, keep to one slice.",
    leadTimeDays: 2,
    servesText: "Serves 10",
    scripture: "Blessed are those who mourn, for they shall be comforted.",
    scriptureRef: "Matthew 5:4",
    isFeatured: false,
    sortOrder: 7,
  },
  {
    slug: "the-share-box",
    name: "The Share Box",
    tagline: "Nine small things, made for giving away",
    description:
      "Our signature gift box: date caramels, cacao truffles, pistachio squares and berry tartlets, nine pieces in a fitted tray, tied with ribbon. Built for the moment you want to say something you do not have words for.",
    story:
      "Every Share Box we sell funds a second one, delivered free to a family in our city walking through a hard week. That was the whole idea behind the name.",
    category: "seasonal",
    priceCents: 5400,
    unitLabel: "box of 9",
    imageKey: "giftBox" as const,
    ingredients: [
      { name: "Medjool dates" },
      { name: "Raw cashews" },
      { name: "Raw pistachios" },
      { name: "Raw cacao powder" },
      { name: "Coconut cream" },
      { name: "Coconut oil" },
      { name: "Almond flour" },
      { name: "Monk fruit extract" },
      { name: "Seasonal berries" },
      { name: "Vanilla bean" },
      { name: "Sea salt" },
    ],
    allergens: ["tree nuts (cashew, pistachio, almond)", "coconut"],
    badges: ["vegan", "gluten-free", "no refined sugar", "diabetes-friendly", "gives one away"],
    servingSize: "1 piece (24 g)",
    calories: 96,
    totalCarbsG: 8.1,
    fiberG: 2.2,
    sugarsG: 4.1,
    addedSugarsG: 0,
    sugarAlcoholG: 0,
    proteinG: 2.1,
    fatG: 6.4,
    satFatG: 2.6,
    sodiumMg: 28,
    sweetener: "Dates and monk fruit",
    glycemicLoad: 3.2,
    glycemicNote:
      "Small pieces by design, so a guest can have one or two without a second thought.",
    leadTimeDays: 4,
    servesText: "9 pieces",
    scripture: "Each of you should use whatever gift you have received to serve others.",
    scriptureRef: "1 Peter 4:10",
    isFeatured: true,
    sortOrder: 0,
  },
];

const ingredients = [
  {
    slug: "medjool-dates",
    name: "Medjool dates",
    kind: "sweetener",
    summary:
      "Whole dried fruit, blended into a caramel paste. It brings sweetness, body and a deep toffee note all at once.",
    benefits:
      "Because the fruit stays whole, its fibre comes along for the ride — which is precisely what slows the sugar down. A date is not the same thing as the sugar extracted from it.",
    glycemicIndex: 42,
    sortOrder: 1,
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
    sortOrder: 2,
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
    sortOrder: 3,
  },
  {
    slug: "almond-flour",
    name: "Almond flour",
    kind: "flour",
    summary:
      "Blanched almonds, finely ground. The backbone of most of our cakes and cookies.",
    benefits:
      "High in protein, fat and fibre, low in available carbohydrate. It flattens the glycemic curve of everything it is baked into.",
    glycemicIndex: 0,
    sortOrder: 4,
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
    sortOrder: 5,
  },
  {
    slug: "ground-flaxseed",
    name: "Ground flaxseed",
    kind: "binder",
    summary:
      "Mixed with water it forms a gel that behaves remarkably like egg. This is how our cakes hold together.",
    benefits:
      "Omega-3 fats, lignans and a lot of soluble fibre. It does a job an egg cannot: it adds fibre rather than cholesterol.",
    glycemicIndex: 0,
    sortOrder: 6,
  },
  {
    slug: "coconut-cream",
    name: "Coconut cream",
    kind: "fat",
    summary:
      "Full-fat, unsweetened. It whips, it sets, and it makes ganache without a drop of dairy.",
    benefits:
      "Naturally free of lactose and casein, and its fat slows gastric emptying — which is a technical way of saying dessert lands softer.",
    glycemicIndex: null,
    sortOrder: 7,
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
    sortOrder: 8,
  },
  {
    slug: "extra-virgin-olive-oil",
    name: "Extra-virgin olive oil",
    kind: "fat",
    summary:
      "Cold-pressed, peppery, and used where most bakeries would reach for butter.",
    benefits:
      "Monounsaturated fat and polyphenols. It is the single easiest swap that makes a dessert kinder to the heart.",
    glycemicIndex: null,
    sortOrder: 9,
  },
  {
    slug: "ceylon-cinnamon",
    name: "Ceylon cinnamon",
    kind: "spice",
    summary:
      "True cinnamon — softer and sweeter than the cassia most shops sell.",
    benefits:
      "Small but real evidence for improved insulin sensitivity, and it lets us use less sweetener because the brain reads cinnamon as sweetness.",
    glycemicIndex: null,
    sortOrder: 10,
  },
  {
    slug: "avocado",
    name: "Avocado",
    kind: "fruit",
    summary:
      "Ripe, blended smooth. It is the secret behind our mousse and nobody ever tastes it.",
    benefits:
      "Almost eighty percent of its carbohydrate is fibre. It delivers a silky texture that would otherwise need cream and eggs.",
    glycemicIndex: 15,
    sortOrder: 11,
  },
  {
    slug: "chia-seeds",
    name: "Chia seeds",
    kind: "binder",
    summary:
      "Tiny seeds that hold many times their weight in liquid, setting puddings without gelatin.",
    benefits:
      "Nearly all of their carbohydrate is fibre, and the gel they form genuinely slows sugar absorption.",
    glycemicIndex: 1,
    sortOrder: 12,
  },
];

const reviews = [
  {
    name: "Marcy T.",
    location: "Riverside",
    rating: 5,
    title: "I cried a little",
    body: "I was diagnosed with type 2 in March and I had made peace with never having cake at my own birthday again. My daughter ordered the chocolate torte. I checked my sugar after and it barely moved. I have not stopped telling people.",
    dessertSlug: "chocolate-date-torte",
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
    title: "Wedding dessert table",
    body: "The pistachio rose tart was the most photographed thing at our wedding, including the bride. Three separate guests asked me where the bakery was before the night was over.",
    dessertSlug: "pistachio-rose-tart",
    isFeatured: true,
    isVerified: true,
  },
  {
    name: "Sam W.",
    location: "Northside",
    rating: 4,
    title: "Genuinely good, plan ahead",
    body: "The mousse jars are outstanding and my kids have no idea there is avocado in them. Only note is that you do need to order a few days out — but honestly that is why it tastes made-to-order, so I have made my peace.",
    dessertSlug: "chocolate-avocado-mousse",
    isFeatured: false,
    isVerified: true,
  },
  {
    name: "Ruth and Elena",
    location: "Westbrook",
    rating: 5,
    title: "The Share Box did what we could not",
    body: "Our friend lost her mother and we had no words at all. We sent the Share Box. She told us later she sat on the kitchen floor and ate a date caramel and felt held. Thank you for building a business around that.",
    dessertSlug: "the-share-box",
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

  // ── Pantry glossary ───────────────────────────────────────
  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { slug: ingredient.slug },
      create: ingredient,
      update: ingredient,
    });
  }
  console.log(`\n  ✓ ${ingredients.length} pantry entries`);

  // ── The opening menu ──────────────────────────────────────
  const menu = await prisma.menu.upsert({
    where: { slug: "the-opening-collection" },
    create: {
      slug: "the-opening-collection",
      title: "The Opening Collection",
      subtitle: "Everything we know how to do, all in one place",
      description:
        "Our founding menu. Eight desserts, none of them containing dairy, eggs or refined sugar, every one of them built so that nobody at your table has to sit the dessert course out.",
      season: "Everyday",
      coverImageUrl: cdn("hero"),
      isActive: true,
    },
    update: { isActive: true, coverImageUrl: cdn("hero") },
  });

  for (const [index, item] of desserts.entries()) {
    const dessertId = dessertRecords[item.slug];
    await prisma.menuItem.upsert({
      where: { menuId_dessertId: { menuId: menu.id, dessertId } },
      create: { menuId: menu.id, dessertId, sortOrder: index },
      update: { sortOrder: index },
    });
  }
  console.log("  ✓ The Opening Collection menu");

  // ── Gatherings ────────────────────────────────────────────
  const events = [
    {
      slug: "sunday-tasting-table",
      title: "The Sunday Tasting Table",
      description:
        "Come and taste every dessert on the current menu, meet the people who bake them, and ask every question you have about baking without sugar. Free, and everyone is welcome — bring someone who thinks they cannot eat dessert any more.",
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
        "Three hours, small group. We will make the chocolate torte and the everyday cookie together, and you will leave understanding allulose, monk fruit and flax eggs well enough to bake without us. Includes everything you make.",
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
        "One long table, one dessert course, and a room full of people who have never met. We put the boxes on the table and see what happens. Proceeds fund the Share Boxes we give away.",
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
