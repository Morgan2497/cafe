import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { 
    cart, 
    savedItems,
    updateQuantity, 
    removeFromCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    isLoading 
  } = useCart();

  const navigate = useNavigate();

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (isLoading) return (
    <div className="container">
      <div className="loading">Loading cart...</div>
    </div>
  );

  const totalQuantity = calculateTotalQuantity();

  const handleProceedToCheckout = () => {
    console.log('Navigating to stripe checkout...');
    navigate('/stripe-checkout');
  };

  return (
    <div className="cart-page-container">
      <h1>Your Shopping Cart</h1>
      
      <div className="cart-section">
        <h2>Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'} - Total Quantity: {totalQuantity})</h2>
        
        {cart.length === 0 ? (
          <div className="empty-cart-message">
            <p>Your cart is empty.</p>
            {savedItems.length > 0 && (
              <p>Check your saved items below or continue shopping.</p>
            )}
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="item-number">Product #: {item.productNumber}</p>
                    <p className="item-size">Size: {item.sizeName}</p>
                    <p className="item-price">${item.price.toFixed(2)}</p>
                    
                    <div className="item-actions">
                      <div className="quantity-control">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="item-buttons">
                        <button 
                          onClick={() => saveForLater(item.id)}
                          className="save-for-later-btn"
                        >
                          Save for later
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="cart-item-subtotal">
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="cart-total">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn" 
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
      
      {savedItems.length > 0 && (
        <div className="saved-items-section">
          <h2>Saved for Later ({savedItems.length} items)</h2>
          
          <div className="saved-items">
            {savedItems.map(item => (
              <div key={item.id} className="saved-item">
                <div className="saved-item-image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
                <div className="saved-item-details">
                  <h3>{item.name}</h3>
                  <p className="item-number">Product #: {item.productNumber}</p>
                  <p className="item-size">Size: {item.sizeName}</p>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                  
                  <div className="item-actions">
                    <button 
                      onClick={() => moveToCart(item.id)}
                      className="move-to-cart-btn"
                    >
                      Move to Cart
                    </button>
                    <button 
                      onClick={() => removeSavedItem(item.id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
