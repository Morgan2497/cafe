import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePayment from '../contexts/payment/StripePayment';
import { useAuth } from '../contexts/AuthContext';
import './Checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeCheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    setIsLoading(false);
  }, [cart, navigate]);

  const handlePaymentSuccess = () => {
    clearCart();
    
    navigate('/payment-success');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (isLoading) {
    return <div className="checkout-loading">Loading checkout...</div>;
  }

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Secure Checkout</h1>
      
      <div className="checkout-content">
        <div className="checkout-left">
          <div className="checkout-steps">
            {!currentUser && (
              <div className="checkout-step active">
                <span className="step-number">1</span>
                <span className="step-title">Customer Information</span>
              </div>
            )}
            <div className="checkout-step">
              <span className="step-number">{!currentUser ? '2' : '1'}</span>
              <span className="step-title">Shipping Details</span>
            </div>
            <div className="checkout-step">
              <span className="step-number">{!currentUser ? '3' : '2'}</span>
              <span className="step-title">Payment Details</span>
            </div>
            <div className="checkout-step">
              <span className="step-number">{!currentUser ? '4' : '3'}</span>
              <span className="step-title">Order Confirmation</span>
            </div>
          </div>
          
          <div className="payment-section">
            <Elements stripe={stripePromise}>
              <StripePayment 
                amount={cartTotal} 
                cart={cart}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        </div>

        <div className="checkout-right">
          <div className="section summary">
            <h2>Order Summary</h2>
            {cart.map((item) => (
              <div className="summary-item" key={item.id}>
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.quantity} x ${item.price.toFixed(2)}</p>
                </div>
                <div className="subtotal">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            
            <div className="order-totals">
              <div className="subtotal-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="shipping-row">
                <span>Shipping</span>
                <span className="shipping-placeholder">Calculated at next step</span>
              </div>
              <div className="total">
                <span>Total</span>
                <span id="total-amount" className="total-amount"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutPage;
