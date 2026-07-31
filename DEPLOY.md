# Getting Sweet Share online

From nothing to `sweetshare.shop`, in order. Budget about half an hour.

Nothing here is reversible-scary — you can do steps 1 and 2 today and leave the
rest until you are ready to take money.

---

## 1. Database — Supabase

The app uses Postgres. Supabase's free tier is more than enough.

1. Create a project at [supabase.com](https://supabase.com). Save the database
   password it gives you — it is only shown once.
2. In the dashboard: **Connect** (top bar) → **ORMs** → **Prisma**.
3. Copy the two connection strings. They differ by port:

   | Variable | Port | Used for |
   |---|---|---|
   | `DATABASE_URL` | **6543** (pooled, `?pgbouncer=true`) | Running the site |
   | `DIRECT_URL` | **5432** (direct) | Migrations |

   Both are needed. A connection pooler cannot carry a migration, and a
   serverless app will exhaust a direct connection pool — hence one of each.

4. Locally, put them in `.env`, then create the tables and fill them:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

   You should see the three desserts, ten pantry entries and three gatherings.

**Neon, Railway or your own Postgres** all work identically. If your provider
has no pooler, set `DIRECT_URL` to the same string as `DATABASE_URL`.

---

## 2. Hosting — Vercel

1. Push this branch to GitHub if you have not already.
2. [vercel.com/new](https://vercel.com/new) → import the repo → pick the branch.
3. Add the environment variables below **before** the first deploy.
4. Deploy.

### Environment variables

| Variable | Required | What happens without it |
|---|---|---|
| `DATABASE_URL` | ✅ | Nothing works |
| `DIRECT_URL` | ✅ | Migrations fail |
| `ADMIN_PASSWORD` | ✅ | You cannot sign in |
| `SESSION_SECRET` | ✅ | Build refuses to start in production |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Stripe returns customers to the wrong place |
| `STRIPE_SECRET_KEY` | Payments | No payment links, gift cards or club |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | — |
| `STRIPE_WEBHOOK_SECRET` | Payments | **Payments happen but nothing marks itself paid** |
| `CRON_SECRET` | Club | **Members are billed and no boxes are ever raised** |
| `RESEND_API_KEY` | Email | No email sends; it logs to the server instead |
| `FROM_EMAIL` | Email | — |
| `ORDER_NOTIFICATION_EMAIL` | Email | You are not told about new orders |
| `BLOB_READ_WRITE_TOKEN` | Uploads | Admin image uploads fail |

Generate the secrets with `openssl rand -base64 32`.

---

## 3. Stripe webhook

**Dashboard → Developers → Webhooks → Add endpoint**

Endpoint URL:

```
https://sweetshare.shop/api/stripe/webhook
```

### Events to subscribe to

All nine. Each one does a specific job:

| Event | What it does |
|---|---|
| `checkout.session.completed` | Marks an order paid; activates a gift card; starts a membership |
| `checkout.session.async_payment_succeeded` | Bank transfer finally cleared — marks the order paid |
| `checkout.session.async_payment_failed` | Bank transfer bounced — puts the order back to unpaid and warns you |
| `checkout.session.expired` | Link went unused; clears it so you can send a fresh one |
| `charge.refunded` | Marks an order refunded, or voids a refunded gift card |
| `customer.subscription.updated` | Keeps membership status and renewal date in step |
| `customer.subscription.deleted` | Marks a membership cancelled |
| `invoice.paid` | Renews a membership's right to boxes |
| `invoice.payment_failed` | Marks a member past due — no boxes until they pay |

Then copy that endpoint's **signing secret** into `STRIPE_WEBHOOK_SECRET` on
Vercel and redeploy.

> Live and test mode have **separate** webhook endpoints and separate signing
> secrets. The `whsec_` from `stripe listen` will not work in production.

### Do not create anything in the Product catalog

Prices are sent inline at checkout, so an empty Product catalog is correct.
There is nothing to set up there for the club or for gift cards.

---

## 4. The daily club job

Already scheduled in `vercel.json` for 07:00 UTC. It only needs `CRON_SECRET`
set — Vercel then sends it automatically.

**This is the easiest thing to get wrong, because nothing looks broken.**
Stripe bills, members show as active, the dashboard looks healthy — and no box
ever reaches your kitchen. After your first deploy, check it by hand:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://sweetshare.shop/api/cron/club-boxes
```

You want `{"ok":true,...}`. A 401 means the secret does not match.

---

## 5. Domain

Vercel → your project → **Settings → Domains** → add `sweetshare.shop`, then
follow the DNS records it gives you. Set `NEXT_PUBLIC_SITE_URL` to match.

---

## 6. Images onto your own domain

The brand imagery currently loads from the Higgsfield CDN. Before you
advertise anywhere:

```bash
npm run media:download
```

Then set `NEXT_PUBLIC_LOCAL_MEDIA=1` and redeploy. Every image and the hero
video switch to `/images/…` on your own domain.

---

## Before you take a single real order

- [ ] Stripe account activation finished — the orange banner in the dashboard
- [ ] `ADMIN_PASSWORD` and `SESSION_SECRET` are real values
- [ ] Test-mode Stripe keys swapped for live ones
- [ ] Live webhook added, its own signing secret in place
- [ ] `CRON_SECRET` set, and the job returns `ok:true`
- [ ] One real order placed, paid and refunded end to end
- [ ] One gift card bought and redeemed
- [ ] Nutrition figures verified — see the note in README

---

## Note on migrations

`prisma db push` is right for setting up and for development. Once you have
real orders, switch to `prisma migrate dev` / `prisma migrate deploy` so
changes are versioned and reviewable. `db push --accept-data-loss` can drop
columns without asking; never point it at a database holding orders.

---

## 7. Search and answer engines

The site ships SEO and AEO (answer-engine optimisation) already wired in. Three
things to do once you are live:

1. **[Google Search Console](https://search.google.com/search-console)** — add
   `sweetshare.shop`, verify by DNS, submit `https://sweetshare.shop/sitemap.xml`.
2. **[Bing Webmaster Tools](https://www.bing.com/webmasters)** — same, and it
   feeds Copilot.
3. **Google Business Profile** — for a local food business this outranks almost
   everything else. Free, and worth an hour.

### What is already built

| File | Purpose |
|---|---|
| `/sitemap.xml` | Generated from the database — new desserts appear automatically |
| `/robots.txt` | Invites GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others in; keeps them out of `/admin` and order pages |
| `/llms.txt` | A plain-language brief for AI assistants, built live from your menu |

Every dessert page publishes `schema.org/Product` including a full
`NutritionInformation` block, net carbs, allergens, price, availability and
real reviews. The FAQ publishes `FAQPage`; gatherings publish `Event`; every
page has a canonical URL and its own social card.

**Why the nutrition markup matters more than anything else here.** When someone
asks an assistant "where can I get a dessert that won't spike my blood sugar",
prose gets paraphrased and hedged — a machine-readable nutrition panel gets
quoted. That structured data is the single strongest reason an answer engine
would name Sweet Share instead of describing a category.

### Keep it honest

The `llms.txt` file states the caveats as plainly as the claims — estimates not
lab analysis, shared kitchen, not medical advice. Leave that in. An assistant
that repeats your caveats is one that can be trusted to repeat your claims.
