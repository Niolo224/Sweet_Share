import type { Metadata } from "next";
import Link from "next/link";
import Accordion, { type QA } from "@/components/Accordion";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";

export const metadata: Metadata = {
  title: "Questions & Facts",
  description:
    "How Sweet Share bakes without dairy, eggs or refined sugar — and what the science actually says about allulose, monk fruit, dates and blood sugar.",
};

const FACTS = [
  {
    stat: "0 g",
    label: "Added sugar",
    body: "In every dessert on the menu. Sweetness comes from whole fruit, monk fruit and allulose.",
  },
  {
    stat: "~90%",
    label: "Of guests cannot tell",
    body: "In our own blind tastings, most people cannot pick our cookie out from a conventional one.",
  },
  {
    stat: "2–4 days",
    label: "Typical notice",
    body: "Nothing is pre-made. Your order is baked on the morning of the day you chose.",
  },
  {
    stat: "1 for 1",
    label: "Share Boxes given",
    body: "Every Share Box sold funds one delivered free to a family in a hard week.",
  },
];

const GENERAL: QA[] = [
  {
    q: "Is everything really vegan?",
    a: "Yes — all of it, without exception. No dairy, no eggs, no honey, no gelatin, no butter, no whey. This is not a vegan section of a menu; it is the whole menu, and it always has been.",
  },
  {
    q: "Is this safe for someone with diabetes?",
    a: "Our desserts are built specifically to be gentle on blood sugar — sweetened with monk fruit and allulose rather than sugar, and high in fibre, fat and protein, which all slow glucose absorption. That said, we are bakers, not clinicians. Every product page publishes its net carbs, added sugars and estimated glycemic load so you and your care team can make the call. Please do read them, and please do talk to your doctor.",
  },
  {
    q: "What is allulose, and is it safe?",
    a: "Allulose is a rare sugar that occurs naturally in figs, raisins and maple syrup. It tastes and behaves almost exactly like sugar in the oven, but the body absorbs it without metabolising it for energy — so it contributes essentially no calories and does not raise blood glucose or insulin. It is recognised as safe by the FDA. A small number of people find large amounts unsettling to the stomach; our portions are modest for that reason.",
  },
  {
    q: "Why monk fruit rather than stevia?",
    a: "Honestly, taste. Monk fruit has a rounder sweetness and far less of the bitter aftertaste stevia can leave, especially alongside cacao. Both are zero-glycemic; we simply think monk fruit makes a better dessert.",
  },
  {
    q: "Dates are sugar, though — aren't they?",
    a: "They are, and we say so plainly. The difference is that a date arrives with its fibre intact, and that fibre genuinely changes how quickly the sugar reaches your blood. It is not the same as the equivalent spoonful of white sugar. Where we use dates we say so, we publish the numbers, and on our fruit-sweetened items like the banana bread we tell you outright that it carries more natural sugar than the rest of the menu.",
  },
  {
    q: "Are the desserts gluten-free?",
    a: "Most are — the tortes, tarts, cookies and mousses are built on almond and oat flour. The apple hand pies use spelt, which contains gluten. Every product page lists its allergens. We are not a certified gluten-free facility, so if you have coeliac disease please tell us and we will talk you through what we can and cannot guarantee.",
  },
  {
    q: "What about nut allergies?",
    a: "Almonds, cashews and pistachios appear across the menu, so we are honest that this is a nut-heavy kitchen. The Chocolate Avocado Mousse is our nut-free option. If you need a nut-free order, write to us before ordering and we will tell you exactly what is possible.",
  },
];

const ORDERING: QA[] = [
  {
    q: "How far ahead should I order?",
    a: "Between one and four days depending on the item — each product page shows its own lead time, and your basket automatically works out the earliest date you can choose. For large orders, catering or anything over about twenty servings, a week is kinder to everyone.",
  },
  {
    q: "When and how do I pay?",
    a: "Not at checkout. You place the request, we read it and confirm the details by email, and only then do we send a secure payment link. We would rather talk to you first than take money for something we have not confirmed we can make.",
  },
  {
    q: "Do you deliver?",
    a: "Locally, yes — a flat delivery fee, free on orders over $60. Collection is always free. We do not ship nationally yet, because most of what we bake does not travel well without preservatives, and we are not willing to add any.",
  },
  {
    q: "Can you make something that is not on the menu?",
    a: "Often, yes. Custom cakes, wedding tables, church lunches and corporate orders are a real part of what we do. Tell us the occasion, the numbers and the dietary needs, and we will tell you honestly whether we can do it well.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "Of course — just tell us before we start baking, which is normally the morning of your date. After that we will have bought the ingredients and made the thing, so we would ask you to take it anyway. Life happens; talk to us.",
  },
  {
    q: "How long does it keep?",
    a: "Because there are no preservatives: cookies and breads three to four days in an airtight tin, tortes and tarts four to five days refrigerated, mousse jars three days refrigerated. Most things freeze beautifully — ask and we will tell you which.",
  },
];

const HEART: QA[] = [
  {
    q: "Do I have to be a Christian to order?",
    a: "Not remotely. We are a Christian family and that shapes how we run this — the honesty of our labels, the box we give away for every one we sell, the way we treat people. But the table is open. You do not have to share our faith to be fed by us, and nobody will ever be preached at for buying a cookie.",
  },
  {
    q: "What is the Share Box, exactly?",
    a: "It is our gift box of nine small desserts, and it is the reason the company is called what it is. For every one sold, we bake and deliver a second one free to a family in our city going through a hard week — a diagnosis, a loss, a new baby, a job gone. We do not publicise who receives them.",
  },
  {
    q: "Can you cater a church or community event?",
    a: "Gladly, and it is some of our favourite work. Being able to put one dessert on every plate — with the vegans, the coeliacs, the diabetics and the child with the egg allergy all eating the same thing — is exactly what we built this for. Write to us with your numbers and date.",
  },
];

export default function FaqPage() {
  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={18} />
        <div className="shell relative text-center">
          <p className="eyebrow">Everything, in the open</p>
          <h1 className="mt-4 text-[clamp(2.6rem,7vw,5.5rem)]">
            Questions & Facts
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            The things people ask us most, answered properly — including the
            awkward ones about sugar. If your question is not here, please just
            ask it.
          </p>
        </div>
      </header>

      <section className="py-14">
        <div className="shell">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact, index) => (
              <Reveal
                key={fact.label}
                delay={index * 90}
                className="card-plinth rounded-2xl p-7 text-center"
              >
                <p
                  className="text-4xl leading-none text-berry"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {fact.stat}
                </p>
                <p className="mt-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-candy">
                  {fact.label}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                  {fact.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="shell mx-auto max-w-3xl space-y-16">
          {[
            { heading: "What is in it", items: GENERAL },
            { heading: "Ordering", items: ORDERING },
            { heading: "Who we are", items: HEART },
          ].map((group) => (
            <div key={group.heading}>
              <Reveal className="rule-ornament mb-8">
                <span className="text-[0.65rem] uppercase tracking-[0.28em]">
                  {group.heading}
                </span>
              </Reveal>
              <Reveal delay={80}>
                <Accordion items={group.items} />
              </Reveal>
            </div>
          ))}

          <Reveal className="rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white px-8 py-12 text-center sm:px-16">
            <h2 className="text-3xl">Still wondering something?</h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-soft">
              There is no such thing as a silly question about food you are
              going to eat. Ask us anything — especially if you are newly
              diagnosed and still working out what is safe.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/pantry" className="btn btn-ghost">
                Read the pantry
              </Link>
              <Link href="/contact" className="btn btn-primary btn-sheen">
                Ask us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
