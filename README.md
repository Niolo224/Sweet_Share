# Sweet Share

> A gallery in dessert heaven — plant-based, diabetes-friendly desserts, made to
> be shared.

Sweet Share is a complete online dessert shop: a museum-style gallery where
every dessert is exhibited with its full ingredient list and nutrition, an
advance-order system, an email list, moderated testimonials, gatherings with
RSVPs, and a dashboard that lets the owner run all of it without touching code.

Everything on the menu is **vegan — no dairy, no eggs — and free of refined
sugar**, sweetened with dates, monk fruit and allulose.

---

## Getting started

```bash
npm install
cp .env.example .env       # then edit it — see below
npm run setup              # creates the tables and fills them with the opening collection
npm run dev                # http://localhost:3000
```

You need a Postgres database first — [Supabase](https://supabase.com)'s free
tier takes about two minutes to set up, and **[DEPLOY.md](./DEPLOY.md)** walks
through it. Development and production use the same database engine
deliberately, so nothing behaves differently once it is live.

Sign in to the dashboard at **`/admin`** using the `ADMIN_PASSWORD` from your
`.env`.

### The variables you must set

```env
DATABASE_URL="postgresql://…"   # pooled connection, port 6543 on Supabase
DIRECT_URL="postgresql://…"     # direct connection, port 5432 — for migrations
ADMIN_PASSWORD="something only you know"
SESSION_SECRET="a long random string — openssl rand -base64 32"
```

Everything else in `.env.example` is optional. Without Stripe the shop still
takes orders and you arrange payment yourself; without Resend, emails print to
the server log instead of sending.

---

## What is in it

### For your guests

| Page | What it does |
|---|---|
| `/` | Cinematic hero, the four promises, featured desserts, an interactive sugar comparison, mission, testimonials, gatherings, email signup |
| `/gallery` | The full collection, filterable by room, dietary need and "gentlest on blood sugar" |
| `/gallery/[slug]` | The exhibit: every ingredient, full nutrition panel, net carbs, glycemic load in plain English, the story behind it, and its reviews |
| `/pantry` | Ingredient glossary — what each thing is, why it earns its place, its glycemic index, and what never goes in |
| `/story` | Story, mission, the four values, a note from the kitchen |
| `/gatherings` | Upcoming events with live RSVP and seat counts |
| `/testimonials` | All approved reviews, rating distribution, and a form to leave one |
| `/club` | The Sweet Share Club — three box tiers, billed monthly or yearly (twelve boxes for eleven months' price) |
| `/gift-cards` | Buy a gift card, sent straight to the recipient with a note |
| `/rewards` | The Table — loyalty with no signup, no card and no app |
| `/order` | Advance-order basket with lead-time enforcement, gift card redemption, pickup or delivery, allergy notes |
| `/faq` | Questions and facts, including the honest ones about sugar |
| `/contact` | Catering, wholesale, custom orders, prayer requests |

### For you — the dashboard at `/admin`

- **Overview** — open orders, revenue this month, what needs attention
- **Orders** — every advance order, filterable, with status and payment
  tracking, one-click Stripe payment links, and CSV export
- **Club** — members, monthly recurring revenue, which boxes need baking, and
  one-click cancellation
- **Gift cards** — every card, its balance and full movement history, your
  unredeemed liability, plus issuing comped cards by hand
- **The Table** — loyalty balances, tiers, future liability, the full points
  ledger, and manual adjustments
- **Desserts** — add and edit desserts, upload photos, write ingredients and
  full nutrition, feature them, rest them for a season
- **Menus** — build seasonal menus from your desserts, upload a printed PDF,
  publish one as live
- **Gatherings** — create events, see every RSVP and email all attendees at once
- **Reviews** — approve, reject, reply publicly, feature on the home page
- **Email list** — everyone who signed up, where from, and a CSV export
- **Messages** — everything from the contact form
- **Site copy** — edit the hero, mission, announcement bar and contact details
  without touching code

---

## The design

The brief was "a realistic museum in dessert heaven". So the structure is a
gallery — pedestals, placards, curated rooms, one exhibit per dessert — and the
world it sits in is literal dessert heaven: cotton-candy skies, heart-shaped
clouds, sugar dust drifting through shafts of golden light.

**Every photograph was generated with [Higgsfield](https://higgsfield.ai)**
(Nano Banana Pro at 2K). The full prompt recipe is documented in
`INTEGRATIONS.md` so new products can be shot to match.

The Christian character of the brand is carried gently — a verse on each
exhibit and four values on the story page — never shouted, and never a
condition of being welcome.

Interaction is deliberate rather than decorative: scroll-triggered reveals,
parallax on the hero sky, levitating desserts, a sugar-comparison slider you
can actually learn something from, filter chips that respond instantly, and a
gold-star review widget. All of it respects `prefers-reduced-motion`.

---

## Images

By default images are served from the Higgsfield CDN so the shop looks finished
the moment you clone it. Before going live, move them to your own domain:

```bash
npm run media:download     # pulls every image and the hero loop into public/images
```

Then add `NEXT_PUBLIC_LOCAL_MEDIA=1` to `.env`. Every reference switches over
with no other change.

---

## Stack

- **Next.js 15** (App Router, React 19, Server Actions)
- **TypeScript**, strict
- **Tailwind CSS v4** with a custom design-token theme
- **Prisma** + Postgres (Supabase, Neon, or your own)
- **Zod** for validating every inbound request
- No component library, no CSS framework beyond Tailwind, no client-side state
  library — the basket is a small context over `localStorage`

### Security

- Admin sessions are HMAC-signed, HTTP-only cookies with a 12-hour life
- Passwords compared in constant time
- Order prices are recalculated server-side from the database — the browser is
  never trusted with money
- Lead times are re-validated on the server
- Every public endpoint is rate-limited
- Reviews are held for moderation before they appear

---

## Commands

```bash
npm run dev              # development server
npm run build            # production build
npm start                # serve the production build
npm run setup            # db push + seed, from scratch
npm run db:seed          # re-seed (safe to run repeatedly)
npm run db:studio        # browse the database in a GUI
npm run media:download   # pull brand imagery into public/images
```

---

## Deploying

**[DEPLOY.md](./DEPLOY.md)** is the step-by-step: Supabase, Vercel, the Stripe
webhook and its nine events, the daily club job, and the domain. Start there.

**[STRIPE.md](./STRIPE.md)** covers payments in depth — how gift cards and the
club work, test cards, and what was and was not verified.

**[INTEGRATIONS.md](./INTEGRATIONS.md)** is the wider playbook: analytics, email
marketing, delivery, and the two non-software things (nutrition verification and
cottage food law) that matter more than any tool on the list.

---

## A note on the nutrition figures

The seeded numbers are carefully reasoned estimates, not laboratory analysis,
and the site says so on every product page. Keep that disclosure. Before
printing a label or making a health claim, get recipes verified — your
customers are making real decisions from these numbers.

---

*“Do not neglect to do good and to share what you have.”* — Hebrews 13:16

---

## Loyalty — The Table

There are no customer accounts on this site, and adding them to support loyalty
would have damaged a guest checkout that works. So points attach to the email
address someone already gives at checkout: nothing to join, no card, no app.

A reward is not a second kind of balance. When someone crosses the threshold, a
**gift card is minted and emailed automatically** — redemption then runs through
the path that is already built and already safe under concurrency, rather than a
parallel one with its own races to get wrong.

The economics live in one file, `src/lib/loyalty.ts`:

| Dial | Default | Meaning |
|---|---|---|
| `POINTS_PER_DOLLAR` | 1 | Earned on money actually paid |
| `REWARD_THRESHOLD` | 200 | Points needed for a reward |
| `REWARD_VALUE_CENTS` | 1000 | What the reward is worth |
| `CLUB_MULTIPLIER` | 2 | Club members earn double |
| `POINTS_PER_REVIEW` | 25 | For a published review, whatever its rating |

That works out to roughly **5% back** — generous for food without being
ruinous; typical programmes run 3–5%. Change the numbers and new earning
follows immediately; points already banked are unaffected.

Three deliberate choices worth keeping:

- **Points are earned on money paid, not order value.** A gift-card-covered
  order earns nothing, so a reward cannot fund the points that mint another.
- **Rewards are issued automatically.** Asking people to remember to redeem is
  how loyalty schemes become unclaimed liability and mild resentment.
- **Balances are emailed, never displayed.** Anyone could otherwise type an
  address and read a stranger's history, so the lookup replies identically
  whether or not the account exists.

Cancelling an order takes the points back, but never below zero — a reward
already sent is theirs. The admin ledger records what was actually taken and
notes any difference, so the history always reconciles with the balance.
