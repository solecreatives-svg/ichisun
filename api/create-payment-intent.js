// /api/create-payment-intent.js
// Vercel serverless function — creates a Stripe PaymentIntent.
// Runs server-side only. Uses STRIPE_SECRET_KEY from Vercel env vars (never exposed to browser).

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Allow the front-end (same domain, but harmless to be explicit) to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, email, orderNum } = req.body;

    // amount must be an integer in the smallest currency unit (e.g. cents for SGD)
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: (currency || 'sgd').toLowerCase(),
      receipt_email: email || undefined,
      metadata: orderNum ? { orderNum } : undefined,
      automatic_payment_methods: { enabled: true }, // lets Stripe decide card / wallet eligibility
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err);
    return res.status(500).json({ error: err.message || 'Payment intent creation failed' });
  }
};
