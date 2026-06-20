require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((v) => v.trim()),
  }),
);
app.use(express.json());

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || secretKey === 'sk_test_your_secret_key_here') {
    return null;
  }
  return require('stripe')(secretKey);
}

app.get('/', (_req, res) => {
  res.json({
    service: 'taste-o-clock-payment-server',
    status: 'ok',
    endpoints: {
      health: 'GET /health',
      createPaymentIntent: 'POST /create-payment-intent',
    },
  });
});

app.get('/health', (_req, res) => {
  const stripeConfigured = Boolean(getStripeClient());
  res.json({
    ok: true,
    stripeConfigured,
    port,
  });
});

app.post('/create-payment-intent', async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({
      error:
        'STRIPE_SECRET_KEY is missing. Copy .env.example to .env and add your test secret key.',
    });
  }

  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'usd').toLowerCase();

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'Invalid amount. Send integer cents, e.g. { "amount": 1250, "currency": "usd" }.',
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        app: 'taste_o_clock',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('[Stripe]', error.message);
    res.status(500).json({
      error: error.message || 'Unable to create payment intent.',
    });
  }
});

const server = app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});


server.on('error', (error) => {
  console.error(`[server] Failed to start on ${port}`, error.message);
  process.exit(1);
});
