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
