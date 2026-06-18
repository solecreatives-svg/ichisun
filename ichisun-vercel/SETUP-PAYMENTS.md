# Ichisun — Real Stripe Payments Setup (Cards + Apple Pay / Google Pay)

## What changed
- Cards now actually charge, via a real PaymentIntent confirmed server-side (previously
  the site only tokenized the card and skipped straight to "order complete" — no real
  charge happened).
- Apple Pay / Google Pay is now a real, working button (previously a placeholder that
  said "Available after site goes live" and did nothing).
- Added `/api/create-payment-intent.js` — a Vercel serverless function that creates the
  PaymentIntent using your **secret** key. This key never touches the browser.

## One-time setup on Vercel

1. **Deploy this folder** (`index.html`, `package.json`, `api/`) as your Vercel project,
   same as before — just make sure the `api` folder comes along this time.

2. **Add your Stripe secret key as an environment variable:**
   - Vercel Dashboard → your project → **Settings** → **Environment Variables**
   - Name: `STRIPE_SECRET_KEY`
   - Value: your `sk_test_...` (or `sk_live_...` once you go live) key from
     Stripe Dashboard → Developers → API keys
   - Make sure it matches the *same mode* as the `pk_test_...` publishable key already
     in `index.html` (test ↔ test, live ↔ live)
   - Redeploy after adding the variable (Vercel needs a fresh deploy to pick it up)

3. **Apple Pay domain verification (one-time, only needed for Apple Pay):**
   - Stripe Dashboard → Settings → Payment methods → Apple Pay → add your live domain
   - Stripe will give you a verification file — host it at
     `/.well-known/apple-developer-merchantid-domain-association` on your deployed site
   - Google Pay needs no separate verification — it works automatically once cards work

## Testing
- Use Stripe test cards (e.g. `4242 4242 4242 4242`, any future expiry, any CVC) while
  `STRIPE_SECRET_KEY` is the test key.
- Apple Pay / Google Pay buttons only appear on supported devices/browsers
  (Safari on Mac/iPhone for Apple Pay; Chrome on Android/desktop with a saved card for
  Google Pay). On unsupported devices, the button area shows a note to use Card instead
  — this is expected, not a bug.

## Notes
- Currency is set to SGD and amounts are sent in cents (`amount * 100`), matching
  Stripe's requirement for the smallest currency unit.
- `automatic_payment_methods: { enabled: true }` is on in the backend function, so
  Stripe will automatically surface any other payment methods you enable in your
  Stripe Dashboard later (e.g. GrabPay via Stripe directly) without further code changes.
