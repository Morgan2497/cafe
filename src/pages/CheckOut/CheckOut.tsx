// ~/cafeteria/src/pages/CheckOut/CheckOut.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// import { useCart } from '../../context/CartContext'; // Remove this line
import styles from './CheckOut.module.css'; // Create this CSS file

interface CheckoutForm {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

// Hardcoded cart data (for demonstration purposes)
const hardcodedCartItems = [
  { id: '1', name: 'Pizza', price: 12.99, quantity: 2 },
  { id: '2', name: 'Burger', price: 8.99, quantity: 1 },
  { id: '3', name: 'Coke', price: 2.50, quantity: 3 },
];

const CheckOut = () => {
  // const { cartItems, getTotalPrice } = useCart(); // Remove this line
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Calculate total price based on hardcoded data
  const totalPrice = hardcodedCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  //   if (cartItems.length === 0) {  //removed this condition
  //     return (
  //       <div className={styles.checkoutContainer}>
  //         <div className={styles.emptyCart}>
  //           <p>Your cart is empty. Please add items to your cart before proceeding to checkout.</p>
  //           <Link to="/menu">Go to Menu</Link>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.checkoutTitle}>Checkout</h1>

      <div className={styles.orderSummary}>
        <h2>Order Summary</h2>
        {hardcodedCartItems.map((item) => (
          <div key={item.id} className={styles.orderItem}>
            <span className={styles.itemName}>{item.name} ({item.quantity})</span>
            <span className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className={styles.total}>
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.shippingInfo}>
        <h2>Shipping Information</h2>
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="zip">ZIP Code</label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              required
            />
          </div>
        </form>
      </div>

      <div className={styles.checkoutButtons}>
        <Link to="/cart">Back to Cart</Link>
        <Link to="/payment">Proceed to Payment</Link>
      </div>
    </div>
  );
};

export default CheckOut;

