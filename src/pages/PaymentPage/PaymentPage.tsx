// ~/cafeteria/src/pages/Payment/PaymentPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './PaymentPage.module.css'; // Create this CSS file

interface BillingInfo {
  name: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
}

const PaymentPage = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    name: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
  });

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing');

    // Simulate payment processing
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real application, you would send this data to a payment gateway
      console.log('Billing Information:', billingInfo);
      setPaymentStatus('success');
      // Redirect to order confirmation or a success page
      navigate('/order-confirmation'); //  make sure you have this route
    } catch (error) {
      setPaymentStatus('error');
      console.error('Payment Error:', error);
    }
  };

  return (
    <div className={styles.paymentContainer}>
      <h1 className={styles.paymentTitle}>Payment</h1>

      <form onSubmit={handleSubmit} className={styles.paymentForm}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name on Card</label>
          <input
            type="text"
            id="name"
            name="name"
            value={billingInfo.name}
            onChange={handleInputChange}
            required
            placeholder="John Doe"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cardNumber">Card Number</label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={billingInfo.cardNumber}
            onChange={handleInputChange}
            required
            placeholder="XXXX-XXXX-XXXX-XXXX"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="expiryDate">Expiry Date</label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={billingInfo.expiryDate}
            onChange={handleInputChange}
            required
            placeholder="MM/YY"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cvv">CVV</label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            value={billingInfo.cvv}
            onChange={handleInputChange}
            required
            placeholder="XXX"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="billingAddress">Billing Address</label>
          <input
            type="text"
            id="billingAddress"
            name="billingAddress"
            value={billingInfo.billingAddress}
            onChange={handleInputChange}
            required
            placeholder="123 Main St"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="billingCity">Billing City</label>
          <input
            type="text"
            id="billingCity"
            name="billingCity"
            value={billingInfo.billingCity}
            onChange={handleInputChange}
            required
            placeholder="Anytown"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="billingState">Billing State</label>
          <input
            type="text"
            id="billingState"
            name="billingState"
            value={billingInfo.billingState}
            onChange={handleInputChange}
            required
            placeholder="CA"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="billingZip">Billing Zip</label>
          <input
            type="text"
            id="billingZip"
            name="billingZip"
            value={billingInfo.billingZip}
            onChange={handleInputChange}
            required
            placeholder="12345"
          />
        </div>

        <div className={styles.paymentButtons}>
          <Link to="/checkout">Back to Checkout</Link>
          <button type="submit" disabled={paymentStatus === 'processing'}>
            {paymentStatus === 'processing' ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </form>

      {paymentStatus === 'success' && (
        <div className={styles.paymentMessage}>
          <p>Payment successful! Your order is being processed.</p>
        </div>
      )}
      {paymentStatus === 'error' && (
        <div className={styles.paymentMessage + ' ' + styles.paymentError}>
          <p>Payment failed. Please check your information and try again.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;

