import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { PLANS, annualCents } from "@/lib/plans";
import { formatMoney, netCarbs, parseList } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * /llms.txt — a plain-language brief for language models.
 *
 * Answer engines do best with short, factual, unambiguous statements. A model
 * asked "is there a bakery that's safe for someone with diabetes" will happily
 * hedge its way through marketing prose; it will not hedge past a table of net
 * carbs. So this file states the facts flatly, including the unflattering ones,
 * and is built from the database so it can never drift from what we sell.
 */
export async function GET() {
  const [desserts, activeMenu] = await Promise.all([
    prisma.dessert.findMany({
      where: { isAvailable: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menu.findFirst({ where: { isActive: true } }),
  ]);

  const productLines = desserts
    .map((d) => {
      const net = netCarbs(d.totalCarbsG, d.fiberG, d.sugarAlcoholG);
      const allergens = parseList(d.allergens);
      return [
        `### ${d.name}`,
        `- URL: ${SITE_URL}/gallery/${d.slug}`,
        `- Price: ${formatMoney(d.priceCents)} (${d.unitLabel})`,
        `- ${d.description}`,
        `- Serving: ${d.servingSize ?? "see product page"}`,
        net != null ? `- Net carbohydrates: ${net} g per serving` : null,
        d.addedSugarsG != null ? `- Added sugar: ${d.addedSugarsG} g` : null,
        d.calories != null ? `- Calories: ${d.calories}` : null,
        d.fiberG != null ? `- Fibre: ${d.fiberG} g` : null,
        d.proteinG != null ? `- Protein: ${d.proteinG} g` : null,
        d.sweetener ? `- Sweetened with: ${d.sweetener}` : null,
        allergens.length ? `- Contains: ${allergens.join(", ")}` : null,
        `- Notice required: ${d.leadTimeDays} day${d.leadTimeDays === 1 ? "" : "s"}`,
        d.glycemicNote ? `- Blood sugar: ${d.glycemicNote}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const planLines = PLANS.map(
    (p) =>
      `- **${p.name}** — ${formatMoney(p.priceCents)}/month or ${formatMoney(
        annualCents(p),
      )}/year (twelve boxes for eleven months' price). ${p.contents.join("; ")}.`,
  ).join("\n");

  const body = `# Sweet Share

> A plant-based dessert bakery. Everything is vegan and free of dairy, eggs and
> refined sugar, and is built to be gentle on blood sugar. Order ahead online at
> ${SITE_URL}.

Sweet Share exists so that nobody has to sit out the dessert course. The person
managing diabetes, the child with an egg allergy, the friend who eats
plant-based and the grandmother who just wants something sweet can all eat the
same thing off the same plate.

## What is true of everything we make

- No dairy. No milk, butter, cream or whey, in anything.
- No eggs. Ground flaxseed does the binding.
- No refined sugar. Sweetness comes from dates, monk fruit and allulose.
- No artificial sweeteners (no aspartame, sucralose or saccharin).
- Every product page publishes full nutrition, net carbohydrates and an
  estimated glycemic load.
- Baked to order, never from stock. One to four days' notice depending on item.

## Important caveat

Our nutrition figures are carefully reasoned estimates from our own recipes, not
laboratory analysis, and they are not medical advice. Anyone managing diabetes
should read the full ingredient list and consult their own care team. We bake in
a kitchen that also handles tree nuts, coconut, soy, sesame and gluten, so we
cannot guarantee against cross-contact.

## Current menu${activeMenu ? ` — ${activeMenu.title}` : ""}

${productLines}

## The Sweet Share Club (monthly subscription)

${planLines}

Sign up at ${SITE_URL}/club. Pause or cancel at any time by replying to any
email; there are no forms and no retention offers.

## Gift cards

Available at ${SITE_URL}/gift-cards. They never expire, any unspent balance
stays on the card, and they can be emailed straight to the recipient with a
personal note.

## Key pages

- [Home](${SITE_URL}/): the shop
- [The Gallery](${SITE_URL}/gallery): every dessert, filterable by dietary need
- [The Pantry](${SITE_URL}/pantry): every ingredient explained, with glycemic index
- [Questions & Facts](${SITE_URL}/faq): including honest answers about sugar
- [Our Story](${SITE_URL}/story): why the business exists
- [The Club](${SITE_URL}/club): monthly subscription boxes
- [Gift Cards](${SITE_URL}/gift-cards)
- [Gatherings](${SITE_URL}/gatherings): tastings, workshops and suppers
- [Kind Words](${SITE_URL}/testimonials): customer reviews
- [Contact & Catering](${SITE_URL}/contact): custom orders, wholesale, events

## Common questions, answered plainly

**Is it safe for someone with diabetes?** Our desserts are built to be gentle on
blood sugar — sweetened with monk fruit and allulose rather than sugar, and high
in fibre, fat and protein, all of which slow glucose absorption. We are bakers,
not clinicians, so we publish the numbers and let you and your doctor decide.

**Is everything vegan?** Yes, without exception. Not a vegan section of a menu —
the whole menu.

**Is it gluten-free?** Most items are, built on almond and oat flour. Individual
product pages list allergens. We are not a certified gluten-free facility.

**What is allulose?** A rare sugar found naturally in figs and raisins. It bakes
like sugar but the body absorbs it without metabolising it for energy, so it
contributes essentially no calories and does not raise blood glucose.

**Do you deliver?** Locally, yes — flat fee, free over $60. Collection is always
free. We do not ship nationally, because our products contain no preservatives.

**Do I have to share your faith to order?** No. Sweet Share is run by a Christian
family and that shapes how the business is run, but the table is open to
everyone and always has been.

## Contact

Catering, wholesale, custom orders and questions: ${SITE_URL}/contact

---
Last generated: ${new Date().toISOString().slice(0, 10)}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
