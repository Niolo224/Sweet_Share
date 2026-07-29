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
npm run setup              # creates the database and fills it with the opening collection
npm run dev                # http://localhost:3000
```

Sign in to the dashboard at **`/admin`** using the `ADMIN_PASSWORD` from your
`.env`.

### The two variables you must change

```env
ADMIN_PASSWORD="something only you know"
SESSION_SECRET="a long random string — openssl rand -base64 32"
```

Everything else in `.env.example` is optional. The shop runs fully without a
single integration: emails log to the console, uploads go to `public/uploads`,
and the database is a local SQLite file.

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
| `/order` | Advance-order basket with lead-time enforcement, pickup or delivery, allergy notes |
| `/faq` | Questions and facts, including the honest ones about sugar |
| `/contact` | Catering, wholesale, custom orders, prayer requests |

### For you — the dashboard at `/admin`

- **Overview** — open orders, revenue this month, what needs attention
- **Orders** — every advance order, filterable, with status and payment
  tracking and CSV export
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
- **Prisma** + SQLite locally, portable to Postgres or Turso
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

See **[INTEGRATIONS.md](./INTEGRATIONS.md)** for the full playbook — hosting,
database, payments, email, analytics, and the two non-software things (nutrition
verification and cottage food law) that matter more than any tool.

The short version: push to GitHub, import into Vercel, move the database to
Turso or Neon, set `RESEND_API_KEY` and `BLOB_READ_WRITE_TOKEN`, and change the
admin password.

---

## A note on the nutrition figures

The seeded numbers are carefully reasoned estimates, not laboratory analysis,
and the site says so on every product page. Keep that disclosure. Before
printing a label or making a health claim, get recipes verified — your
customers are making real decisions from these numbers.

---

*“Do not neglect to do good and to share what you have.”* — Hebrews 13:16
