# Tools to plug into Sweet Share

A shortlist, in the order I would actually do them. Everything in **Tier 1**
you need before you take a single real order. Everything below that makes the
business better once orders are flowing.

Prices are the published rates as of writing — always check before committing.

---

## Tier 1 — before you launch

### 1. Hosting — **Vercel**

The site is a Next.js app, which Vercel builds. Push this repository to GitHub,
import it at [vercel.com/new](https://vercel.com/new), and add the environment
variables from `.env.example`. Every future push deploys itself.

- **Free** for a shop this size; **$20/mo** Pro when you outgrow it.
- Alternatives: Netlify, Railway, Render, Cloudflare Workers (needs an adapter).

### 2. Database — **Turso** or **Neon**

SQLite runs the site locally, but a serverless host has no persistent disk, so
you need a hosted database in production.

- **Turso** — SQLite in the cloud, so your Prisma schema needs almost no
  change. Free tier is generous. Best if you want the simplest path.
- **Neon** — serverless Postgres. Change `provider = "sqlite"` to
  `provider = "postgresql"` in `prisma/schema.prisma`, run `npx prisma db push`,
  then `npm run db:seed`. Free tier, then **$19/mo**.
- **Supabase** — Postgres plus file storage and auth in one. Worth it if you
  later want customer accounts.

### 3. Payments — **Stripe**

The order flow deliberately takes *no* payment at checkout: a guest submits a
request, you confirm it, then you send a payment link. For a made-to-order
bakery this is the right shape — it stops you owing a refund on something you
cannot bake.

Two ways to take the money:

- **Stripe Payment Links** (zero code). Create a link per order in the Stripe
  dashboard and paste it into your confirmation email. Start here.
- **Stripe Checkout** (a little code). Add `STRIPE_SECRET_KEY`, then create a
  Checkout Session from the order record and email the URL. Stripe's webhook
  flips `paymentStatus` to `paid` automatically.

Fees: **2.9% + 30¢** per card charge. No monthly cost.

Alternatives: **Square** (best if you also sell in person — the card reader and
online orders share one catalogue), **PayPal**, **Shop Pay**.

### 4. Transactional email — **Resend**

Already wired in. Order confirmations, RSVP confirmations and review alerts all
send through it the moment you set `RESEND_API_KEY`. Without a key they log to
the console instead, so nothing breaks in development.

1. Sign up at [resend.com](https://resend.com), verify your sending domain.
2. Set `RESEND_API_KEY`, `FROM_EMAIL` and `ORDER_NOTIFICATION_EMAIL`.

**Free** for 3,000 emails/month, then **$20/mo**.

Alternatives: Postmark (best deliverability, $15/mo), SendGrid, Loops.

### 5. Image storage — **Vercel Blob**

Already wired in. Locally, admin uploads land in `public/uploads`. In
production that folder is read-only, so set `BLOB_READ_WRITE_TOKEN` and uploads
route to Blob automatically — no code change.

**Free** to 1 GB, then usage-based.

Alternatives: **Cloudinary** (adds automatic image optimisation and is superb
for food photography), **UploadThing**, **Supabase Storage**.

### 6. Your domain

Buy `sweetshare.com` (or the closest you can get) from Cloudflare Registrar
(at-cost, ~$10/yr) or Namecheap. Point it at Vercel, and set
`NEXT_PUBLIC_SITE_URL` to the real address.

---

## Tier 2 — the first month

### Email marketing — **Kit** (formerly ConvertKit)

Your list already collects into the database, and the admin exports a CSV. To
actually *send* a newsletter, use:

- **Kit** — built for creators, excellent automation, free to 10,000
  subscribers. My pick.
- **Resend Broadcasts** — if you are already on Resend, this keeps everything
  in one account and one bill.
- **Mailchimp** — the familiar option; gets expensive fast.
- **Beehiiv** — if you want the newsletter itself to become a channel.

Worth automating later: push new subscribers straight to Kit from
`src/app/api/subscribe/route.ts` with one extra `fetch`.

### Analytics — **Vercel Analytics** + **Plausible**

- `npm i @vercel/analytics` and add `<Analytics />` to the root layout — one
  line, no cookie banner, **free**.
- **Plausible** ($9/mo) for privacy-friendly, genuinely readable traffic data.
  No cookie consent needed, which matters for a small shop.
- **PostHog** free tier if you want funnels — where people drop out of the
  order flow is the single most valuable thing you can learn.

Avoid Google Analytics 4 unless you need it for ads; it drags a consent banner
and a lot of complexity behind it.

### Google Business Profile — **free, and the highest-return hour you will spend**

For a local food business this outranks almost everything else. Claim your
listing, add the Higgsfield imagery from this repo, and ask happy customers to
review you there as well as on the site. "Vegan bakery near me" traffic is real
and it converts.

Also list on: **Yelp**, **Apple Business Connect**, **Bing Places**.

### Search Console

Add the site to [Google Search Console](https://search.google.com/search-console)
and submit your sitemap. The site already ships `Bakery` structured data in the
root layout, which is what earns the rich result.

---

## Tier 3 — once orders are steady

| Need | Tool | Cost | Why |
|---|---|---|---|
| **Local delivery** | DoorDash Drive, Uber Direct, Roadie | Per-delivery | On-demand couriers without hiring a driver |
| **SMS updates** | Twilio | ~$0.008/msg | "Your order is ready" beats an email for pickup |
| **Live chat** | Crisp, Tawk.to | Free tier | Newly-diagnosed customers ask a *lot* of questions |
| **Scheduling** | Cal.com, Calendly | Free–$12/mo | Tasting appointments and consultations |
| **Loyalty** | Smile.io | Free–$49/mo | Repeat purchase is everything in food |
| **Accounting** | Wave (free), QuickBooks ($30/mo) | — | Track COGS properly from day one |
| **Nutrition labels** | ReciPal ($29/mo), Nutritics | — | See the warning below |
| **Reviews elsewhere** | Google, Trustpilot, Yelp | Free–$ | Social proof off your own domain carries more weight |
| **Social scheduling** | Buffer, Later | Free–$18/mo | Food is a visual business |
| **Error tracking** | Sentry | Free tier | You want to know when checkout breaks |
| **Uptime** | BetterStack, UptimeRobot | Free | Alerts if the shop goes down overnight |

### More imagery — **Higgsfield**

Every photograph in this repository was generated with Higgsfield (Nano Banana
Pro). The prompt recipe that produced the look is in `src/lib/media.json`
alongside each asset — reuse the same phrasing for new products so the whole
gallery stays consistent:

> *"floating weightlessly in the center of a heaven of soft pink and rose
> cotton-candy clouds, heart-shaped clouds drifting in the background, tiny
> sparkles and glowing bokeh stars, warm golden-pink divine light from above,
> hyperreal food detail, soft volumetric glow, cinematic shallow depth of
> field"*

Higgsfield also does video — a five-second levitating hero loop of the Share
Box would lift the front page enormously.

---

## Two things that are not software

### 1. Nutrition claims — get these verified

The nutrition figures currently in the database are **carefully reasoned
estimates, not laboratory analysis**, and the site says so on every product
page. That disclosure is deliberate and you should keep it.

Before you print a physical label or make a health claim in advertising, run
recipes through **ReciPal** or **Nutritics**, or send samples for lab analysis
(around $150–$400 per recipe). In the US, packaged food sold retail generally
needs a compliant Nutrition Facts panel; rules differ for cottage-food and
made-to-order sales. This matters more than usual for you, because customers
managing diabetes are making real decisions from your numbers.

### 2. Cottage food law and insurance

Every state and country handles home-baked food differently — registration,
kitchen inspection, what you may sell and where. Check your local cottage food
rules before your first sale, and get product liability insurance. An allergen
mistake in a nut-heavy kitchen is the risk that actually ends small food
businesses.

---

## What I would do in week one

1. Buy the domain, deploy to Vercel, move the database to Turso or Neon.
2. Set up Resend so order emails actually arrive.
3. Change `ADMIN_PASSWORD` and `SESSION_SECRET` to real values.
4. Run `npm run media:download` and set `NEXT_PUBLIC_LOCAL_MEDIA=1` so your
   images are served from your own domain, not a third party's CDN.
5. Claim the Google Business Profile.
6. Create three Stripe Payment Links — small, medium, custom — so you can
   confirm an order and get paid the same afternoon.
7. Take your first ten orders by hand before automating anything else. You will
   learn more from those ten than from any tool on this page.
