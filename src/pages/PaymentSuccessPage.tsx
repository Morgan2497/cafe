import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccessPage: React.FC = () => {
  const [countdown, setCountdown] = useState(5);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Verify this is a legitimate payment success
  useEffect(() => {
    const isSuccess = location.search.includes('success=true') || localStorage.getItem('payment_success') === 'true';
    
    if (!isSuccess) {
      // If someone tries to access this page directly without a successful payment
      navigate('/');
      return;
    }

    // Auto redirect after countdown
    const timer = setTimeout(() => {
      // Clear payment success flag
      localStorage.removeItem('payment_success');
      
      // Redirect to profile page for logged-in users with a parameter to show orders
      if (currentUser) {
        navigate('/profile?payment_success=true');
      } else {
        // Redirect to home for guest users
        navigate('/');
      }
    }, countdown * 1000);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate, countdown, location.search, currentUser]);

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <div className="success-icon">
          {/* Use a checkmark symbol instead of importing an SVG */}
          <div className="checkmark">✓</div>
        </div>
        
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase. Your order has been processed successfully.</p>
        
        <div className="order-info">
          <p>An email confirmation has been sent to your email address.</p>
          {currentUser && (
            <p>You can view your order details in your <a href="/profile?payment_success=true">account dashboard</a>.</p>
          )}
        </div>
        
        <p className="redirect-message">
          You will be redirected {currentUser ? 'to your order history' : 'to the home page'} in {countdown} seconds...
        </p>
        
        <div className="success-actions">
          <button 
            onClick={() => {
              localStorage.removeItem('payment_success');
              navigate('/');
            }}
            className="action-button secondary"
          >
            Return to Home
          </button>
          
          {currentUser && (
            <button 
              onClick={() => {
                localStorage.removeItem('payment_success');
                navigate('/profile?payment_success=true');
              }}
              className="action-button primary"
            >
              View Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;