import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import { db } from '../src/services/firebase';

// Load the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    const { amount, currency = 'usd', orderId, customer } = data;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        orderId,
        customerEmail: customer.email || 'guest'
      }
    });

    return {
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const handleWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    
    if (orderId) {
      await db.collection('orders').doc(orderId).update({
        status: 'processing',
        statusHistory: [{
          status: 'processing', 
          timestamp: new Date(),
          note: 'Payment received'
        }],
        paymentId: paymentIntent.id,
        paymentStatus: 'completed'
      });
      
      await db.collection('payments').add({
        orderId,
        userId: paymentIntent.metadata.customerId || null,
        guestEmail: paymentIntent.metadata.customerEmail || null,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentDate: new Date(),
        method: 'credit_card',
        status: 'completed',
        gatewayResponse: paymentIntent,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  res.status(200).send('Received');
});