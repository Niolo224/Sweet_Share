# Stripe at Sweet Share

The integration is built and working. This is how to switch it on, test it, and
take it live.

---

## How it works

Payment deliberately does **not** happen at checkout. The flow is:

```
Guest submits an advance order          →  status: pending    payment: unpaid
You press "Send payment link"           →  status: confirmed  payment: unpaid
   ↳ Stripe Checkout Session created
   ↳ guest emailed a secure pay button
Guest pays                              →  Stripe webhook fires
   ↳ card                               →  payment: paid
   ↳ bank transfer (still clearing)     →  payment: processing
   ↳ bank transfer settles, days later  →  payment: paid
```

**Why this shape.** You bake to order, so you need to confirm you can make
something before anyone is charged. It also saves you money: Stripe does not
return its fee when you refund, so a cancelled order under a normal checkout
costs you the fee anyway. Here, a cancelled order costs nothing.

### Bank transfer on large orders

Orders of **$200 or more** offer bank debit alongside card, because that is
where it starts to be worth a guest typing account details:

| | Card | Bank transfer |
|---|---|---|
| Rate | 2.9% + 30¢ | 0.8%, capped at $5 |
| $600 catering order | $17.70 | **$5.00** |

The threshold lives in `ACH_THRESHOLD_CENTS` in `src/lib/stripe.ts`. The orders
dashboard shows you the saving per order.

If ACH is not enabled on your account, session creation falls back to card-only
automatically rather than stranding the order.

---

## Switching it on

### 1. Keys

Already in `.env`:

```env
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_SITE_URL="https://sweetshare.shop"
```

### 2. The webhook — this is the part that makes orders mark themselves paid

Locally:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

It prints a `whsec_...`. Put it in `.env` as `STRIPE_WEBHOOK_SECRET` and
restart `npm run dev`.

In production, add an endpoint in the Stripe dashboard pointing at
`https://sweetshare.shop/api/stripe/webhook`, subscribed to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

The last four are what keep the club running. Miss them and memberships will
bill in Stripe while no boxes ever appear in your kitchen.

Then copy that endpoint's signing secret into your production environment.

**Without `STRIPE_WEBHOOK_SECRET` the payment link still works, but orders will
not update themselves** — you would have to mark them paid by hand. Do not skip
this step.

### 3. Enable ACH (optional, saves real money)

Stripe dashboard → Settings → Payment methods → turn on **US bank account**.

---

## Testing it

```bash
npm run dev
# in a second terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

1. Place an order on the site as a guest.
2. Sign in at `/admin`, open **Orders**, press **Send payment link**.
3. The link is emailed. Without `RESEND_API_KEY` it prints to your terminal
   instead — copy it from there.
4. Pay with the test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. The order flips to **paid** and **confirmed** on its own.

Useful test cards:

| Card | What happens |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined, insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

Test bank account for ACH: routing `110000000`, account `000123456789`.

---

## Gift cards

Bought at `/gift-cards`. Unlike a dessert order there is nothing to bake, so
payment is taken **immediately** — the card is created `pending` and only
becomes spendable once the webhook confirms the money.

At checkout a guest enters the code and it comes off the total. If it does not
cover the whole order, the rest is paid the normal way; if it covers everything,
the order is marked paid with no payment link needed.

Two details worth knowing:

- **Cards cannot be double-spent.** Redemption happens inside a transaction
  with a conditional balance check, so two orders racing on the same code split
  the balance rather than both drawing it down. This is tested.
- **Cancelling an order returns the value** to the card, exactly once, however
  many times the order is re-cancelled.

**Accounting:** money taken for a gift card is a *liability*, not income, until
it is spent. The admin page shows your unredeemed balance — that is what you
owe in dessert. Most US states also ban expiry dates and dormancy fees, and
some require unclaimed balances to be handed to the state after some years.
Worth ten minutes with an accountant before you sell many.

## The club

Members join at `/club`. Prices live in `src/lib/plans.ts` rather than the
database, because changing a subscription price is not a content edit —
existing members keep the price they joined at, held by Stripe. Editing that
file changes what *new* members pay and touches nobody already subscribed.

No Products or Prices need creating in the dashboard: Checkout is given an
inline recurring price, so the club works the moment your keys are set.

### Monthly or yearly

Members choose at signup. Yearly is **eleven months' price for twelve boxes** —
a genuine discount, but the real reason to offer it is fees. Stripe takes
2.9% + 30¢ per charge, and on a $15 box that flat 30¢ is nearly 5%. Billing
once a year turns twelve fees into one and pulls the whole year's cash forward.

| Plan | Monthly | Yearly | Member saves | You save in fees |
|---|---|---|---|---|
| Little Box | $15 | $165 | $15 | ~$3.20/yr |
| Cookie Club | $30 | $330 | $30 | ~$3.20/yr |
| Full Table | $64 | $704 | $64 | ~$3.20/yr |

### How boxes get raised — and why it is not `invoice.paid`

**Billing and baking are separate.** A monthly member pays twelve times and
eats twelve times, so tying boxes to payments looks fine. An annual member pays
*once* and still eats twelve times — tie boxes to `invoice.paid` and they get a
single box for the whole year.

So each member carries their own `nextBoxAt` clock, advanced one month at a
time, and a daily job raises whatever is due. Payments only decide whether that
clock keeps running: a `past_due` member gets no boxes until Stripe collects.

Every box is keyed `<subscriptionId>:<YYYY-MM>` on a unique column, so no
combination of retries, replayed webhooks and overlapping job runs can raise
the same month twice. The job also raises at most one box per member per run —
if it has been down for months, it catches up a day at a time rather than
dumping a year of baking on you at once.

### The daily job

`vercel.json` schedules `/api/cron/club-boxes` for 07:00 UTC daily. Set
`CRON_SECRET` in your environment and Vercel sends it automatically. Any
scheduler works — cron-job.org, GitHub Actions, a crontab — as long as it sends
`Authorization: Bearer $CRON_SECRET`.

**If this job never runs, no club boxes are ever raised.** Everything else will
look healthy: Stripe bills, members are charged, the dashboard shows them
active — and nothing appears in your kitchen. Check it after your first deploy.

To test: join at `/club` with `4242 4242 4242 4242`, then call the job by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/club-boxes
```

## Going live

1. **Roll the test secret key** — it has been shared in plain text, so treat it
   as burned even though test keys cannot move money.
2. Complete Stripe account activation (business details, bank account).
3. Swap `sk_test_`/`pk_test_` for `sk_live_`/`pk_live_` in your **production**
   environment only.
4. Add the live webhook endpoint and use **its** signing secret — live and test
   secrets are different.
5. Place one real order for a small amount and refund it, end to end, before
   you announce anything.

---

## What was verified, and what was not

Verified locally, offline:

- Webhook signature checking rejects unsigned, malformed, wrong-secret,
  replayed, and body-tampered requests — all return 400 and change nothing.
- A genuine `checkout.session.completed` with `payment_status: paid` marks the
  order paid and auto-confirms it.
- A bank debit that has completed the session but not yet settled is held at
  `processing` rather than being treated as paid.
- Two orders placed **simultaneously** against one $50 gift card split it
  $46/$4 — exactly $50 spent, never overdrawn.
- Cancelling a gift-card order returns the value once; cancelling again does
  not return it twice.
- Gift card codes are matched after normalising, so `ss test test test`
  resolves to `SS-TEST-TEST-TEST` and an unknown code is refused.
- An annual member starting on the 31st receives twelve boxes across twelve
  consecutive calendar months with no gaps, extra job runs raise nothing, and a
  `past_due` member receives none.
- The cron endpoint refuses requests with no token or a wrong token.

That annual test earned its keep: the first version skipped February entirely,
because "30 January plus one month" is 30 February, which JavaScript rolls
forward into March. Any member joining on the 29th to 31st would have lost a
box a year, silently. Fixed by clamping to the length of the target month.

Not verified: anything requiring Stripe's servers. `api.stripe.com` is blocked
by the network policy on the machine this was built on, so **no Checkout
Session has actually been created against your account**. Run the test flow
above once locally — it is a five-minute check and it exercises the one path I
could not.

---

## Files

| File | What it does |
|---|---|
| `src/lib/stripe.ts` | Client, ACH threshold, site URL |
| `src/app/admin/actions.ts` | `sendPaymentLinkAction` — builds the Checkout Session |
| `src/app/api/stripe/webhook/route.ts` | Verifies signatures, updates orders |
| `src/app/order/paid/page.tsx` | Where Stripe returns the guest |
| `src/app/admin/orders/page.tsx` | The button, and the per-order ACH saving |
