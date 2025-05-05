const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp();

const stripe = require('stripe')(functions.config().stripe.secret_key);

exports.createPaymentIntent = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { amount, currency = 'usd' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), 
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

exports.handlePaymentSuccess = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { paymentIntentId, userId, orderData } = req.body;

      if (!paymentIntentId || !userId || !orderData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Payment not successful' });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();

      const orderRef = await admin.firestore()
        .collection('orders')
        .add({
          userId,
          paymentIntentId,
          subtotal: orderData.amount, 
          shippingCost: orderData.shippingCost || 0,
          totalAmount: orderData.totalAmount || orderData.amount,
          items: orderData.items,
          status: 'paid',
          createdAt: now,
          updatedAt: now,
          shippingDetails: orderData.shippingDetails || null, 
          shippingOption: orderData.shippingOption || null,
        });

      if (userId && !userId.startsWith('guest_')) {
        await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('orders')
          .add({
            orderId: orderRef.id,
            paymentIntentId,
            subtotal: orderData.amount,
            shippingCost: orderData.shippingCost || 0,
            totalAmount: orderData.totalAmount || orderData.amount,
            status: 'paid',
            createdAt: now,
            shippingDetails: orderData.shippingDetails || null,
            shippingOption: orderData.shippingOption || null,
          });
      }

      await admin.firestore()
        .collection('payments')
        .add({
          orderId: orderRef.id,
          userId: userId,
          guestEmail: userId.startsWith('guest_') ? orderData.email || null : null,
          transactionId: paymentIntentId,
          amount: orderData.totalAmount || orderData.amount,
          currency: 'usd',
          paymentDate: now,
          method: 'credit_card', // Assuming Stripe means credit card
          status: 'completed',
          gatewayResponse: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            created: paymentIntent.created,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method,
            paymentMethodTypes: paymentIntent.payment_method_types,
          },
          createdAt: now,
          updatedAt: now
        });

      res.status(200).json({ success: true, orderId: orderRef.id });
    } catch (error) {
      console.error('Error handling payment success:', error);
      res.status(500).json({ error: error.message });
    }
  });
});
