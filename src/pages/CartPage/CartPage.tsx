import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import './CartPage.css';

const cartItems = [
  {
    id: 1,
    name: "Chicken Sandwich",
    price: 5.99,
    quantity: 2,
    image: "/assets/sandwich.jpg",
  },
  {
    id: 2,
    name: "Iced Coffee",
    price: 2.49,
    quantity: 1,
    image: "/assets/coffee.jpg",
  },
];

const CartPage = () => {
  const total = cartItems
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="empty-cart">Your cart is currently empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Total: ${total}</h2>
            <div className="cart-buttons">
              <button className="clear-btn">Clear Cart</button>
              {/* Use Link for navigation */}
              <Link to="/checkout">
                <button className="checkout-btn">Proceed to Checkout</button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
