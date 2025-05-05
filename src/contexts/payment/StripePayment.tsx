import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../AuthContext';
import './StripePayment.css';

const UPS_SHIPPING_RATES = {
  standard: {
    name: "UPS Ground (free shipping over $200)",
    pricePerItem: 5.99,
    multiplier: 1,
    minPrice: 12.99,
    freeShippingThreshold: 200,
    estimatedDelivery: "5-7 business days"
  },
  express: {
    name: "UPS Next Day Air",
    pricePerItem: 12.99,
    multiplier: 1.5,
    minPrice: 32.99,
    freeShippingThreshold: null,
    estimatedDelivery: "1 business day"
  }
};

interface StripePaymentProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  cart: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    productNumber: string;
    sizeId: string;
    sizeName: string;
    imageUrl: string;
  }>;
}

interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDelivery: string;
}

const StripePayment: React.FC<StripePaymentProps> = ({ 
  amount, 
  onSuccess, 
  onError,
  cart 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const [addressOption, setAddressOption] = useState<'profile' | 'new'>(currentUser ? 'profile' : 'new');
  const [profileAddress, setProfileAddress] = useState<CustomerInfo | null>(null);
  const [hasProfileAddress, setHasProfileAddress] = useState(false);
  const [loadingProfileAddress, setLoadingProfileAddress] = useState(false);
  
  const [step, setStep] = useState(currentUser ? 'info' : 'info');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);

  useEffect(() => {
    if (cart.length > 0) {
      calculateShipping(selectedShipping);
    }
  }, [cart, selectedShipping]);

  const calculateShipping = (shippingType: string) => {
    const totalCartWeight = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = amount;
    
    const rates = UPS_SHIPPING_RATES[shippingType as keyof typeof UPS_SHIPPING_RATES];
    let calculatedPrice = 0;

    if (rates) {
      if (rates.freeShippingThreshold && cartTotal >= rates.freeShippingThreshold) {
        calculatedPrice = 0;
      } else {
        calculatedPrice = Math.max(
          rates.minPrice,
          rates.pricePerItem * Math.ceil(totalCartWeight / 2)
        );
      }
    }

    setShippingCost(calculatedPrice);

    const options: ShippingOption[] = Object.entries(UPS_SHIPPING_RATES).map(([key, value]) => {
      let price = 0;
      
      if (value.freeShippingThreshold && cartTotal >= value.freeShippingThreshold) {
        price = 0;
      } else {
        price = Math.max(
          value.minPrice,
          value.pricePerItem * Math.ceil(totalCartWeight / 2)
        );
      }

      return {
        id: key,
        name: value.name,
        price: price,
        estimatedDelivery: value.estimatedDelivery
      };
    });

    setShippingOptions(options);
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchProfileAddress();
    }
  }, [currentUser]);

  const fetchProfileAddress = async () => {
    if (!currentUser || !currentUser.id) return;
    
    setLoadingProfileAddress(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.address) {
          const address: CustomerInfo = {
            name: userData.name || currentUser.displayName || '',
            email: currentUser.email || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zipCode || '',
            phone: userData.phone || ''
          };
          
          setProfileAddress(address);
          
          if (addressOption === 'profile') {
            setCustomerInfo(address);
          }
          
          setHasProfileAddress(true);
        } else {
          setHasProfileAddress(false);
          setAddressOption('new');
        }
      }
    } catch (error) {
      console.error('Error fetching profile address:', error);
      setHasProfileAddress(false);
      setAddressOption('new');
    } finally {
      setLoadingProfileAddress(false);
    }
  };

  const handleAddressOptionChange = (option: 'profile' | 'new') => {
    setAddressOption(option);
    
    if (option === 'profile' && profileAddress) {
      setCustomerInfo(profileAddress);
      setFormErrors({});
    } else if (option === 'new') {
      setCustomerInfo({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
      });
    }
  };

  const createPaymentIntent = async () => {
    try {
      setIsProcessing(true);

      const totalWithShipping = amount + shippingCost;
      
      const functionUrl = `${import.meta.env.VITE_FIREBASE_FUNCTION_URL}/createPaymentIntent`;
      
      console.log('Creating payment intent with URL:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalWithShipping,
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating payment intent');
      }

      const data = await response.json();
      console.log('Payment intent created successfully:', data);
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (amount > 0 && stripe && step === 'payment') {
      createPaymentIntent();
    }
  }, [amount, stripe, step]);

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCustomerInfo = () => {
    const errors: {[key: string]: string} = {};
    
    if (!customerInfo.name.trim()) errors.name = 'Name is required';
    if (!customerInfo.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) errors.email = 'Email is invalid';
    if (!customerInfo.address.trim()) errors.address = 'Address is required';
    if (!customerInfo.city.trim()) errors.city = 'City is required';
    if (!customerInfo.state.trim()) errors.state = 'State is required';
    if (!customerInfo.zipCode.trim()) errors.zipCode = 'ZIP code is required';
    if (!customerInfo.phone.trim()) errors.phone = 'Phone number is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateCustomerInfo()) {
      if (!currentUser) {
        localStorage.setItem('guest_email', customerInfo.email);
      }
      
      setStep('payment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Stripe has not been properly initialized or payment intent not created');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    console.log('Processing payment...');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      console.log('Confirming card payment...');
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name || currentUser?.displayName || 'Guest Customer',
            email: customerInfo.email || currentUser?.email || undefined,
            address: {
              line1: customerInfo.address || undefined,
              city: customerInfo.city || undefined,
              state: customerInfo.state || undefined,
              postal_code: customerInfo.zipCode || undefined,
            },
            phone: customerInfo.phone || undefined,
          },
        },
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        throw new Error(result.error.message || 'Payment failed');
      } 
      
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded with ID:', result.paymentIntent.id);
        
        await saveOrderToFirestore(result.paymentIntent.id);
        
        console.log('Setting success flags in localStorage');
        localStorage.setItem('payment_success', 'true');
        localStorage.setItem('payment_id', result.paymentIntent.id);
        
        console.log('Navigating to payment success page');
        navigate('/payment-success?success=true');
        
        setTimeout(() => {
          if (onSuccess && typeof onSuccess === 'function') {
            console.log('Navigation fallback: calling onSuccess callback');
            onSuccess();
          }
        }, 500);
      } else {
        console.warn('Payment not succeeded, status:', result.paymentIntent?.status);
        throw new Error('Payment not completed. Please try again.');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      if (error instanceof Error) {
        setPaymentError(error.message);
        if (onError) {
          onError(error.message);
        }
      } else {
        setPaymentError('An unknown error occurred');
        if (onError) {
          onError('An unknown error occurred');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const saveOrderToFirestore = async (paymentIntentId: string) => {
    try {
      const userId = currentUser?.id || localStorage.getItem('guest_session_id');
      
      if (!userId) {
        console.error('No user ID available to save order');
        return;
      }

      try {
        const functionUrl = `${import.meta.env.VITE_FIREBASE_FUNCTION_URL}/handlePaymentSuccess`;
        
        const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
        
        const orderPayload = {
          paymentIntentId,
          userId,
          orderData: {
            amount: amount,
            shippingCost: shippingCost,
            totalAmount: amount + shippingCost,
            items: cart,
            email: customerInfo.email || currentUser?.email || null,
            shippingDetails: {
              name: customerInfo.name || currentUser?.displayName,
              address: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              zipCode: customerInfo.zipCode,
              phone: customerInfo.phone
            },
            shippingOption: {
              method: selectedShippingOption?.name || 'UPS Ground',
              cost: shippingCost,
              estimatedDelivery: selectedShippingOption?.estimatedDelivery || 'N/A'
            }
          },
        };
        
        console.log('Sending order payload to Firebase Function:', orderPayload); 

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Order saved successfully via function:', data.orderId);
          return;
        } else {
          console.error('Firebase Function failed:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error calling Firebase function to save order:', error);
      }

      console.log('Falling back to client-side order save.');
      const now = Timestamp.now();
      
      const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
      
      const orderData = {
        userId,
        paymentIntentId,
        amount,
        shippingCost,
        totalAmount: amount + shippingCost,
        items: cart,
        status: 'paid',
        createdAt: now,
        updatedAt: now,
        shippingDetails: {
          name: customerInfo.name || currentUser?.displayName,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          phone: customerInfo.phone
        },
        shippingOption: {
          method: selectedShippingOption?.name || 'UPS Ground',
          cost: shippingCost,
          estimatedDelivery: selectedShippingOption?.estimatedDelivery || 'N/A'
        }
      };
      
      console.log('Saving order data directly to Firestore:', orderData);
      
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Order saved with ID:', orderRef.id);
      
      await addDoc(collection(db, 'payments'), {
        orderId: orderRef.id,
        userId: userId,
        guestEmail: userId.startsWith('guest_') ? orderData.email || null : null,
        transactionId: paymentIntentId,
        amount,
        currency: 'usd',
        paymentDate: now,
        method: 'credit_card',
        status: 'completed',
        gatewayResponse: { paymentIntentId },
        createdAt: now,
        updatedAt: now
      });
      
      if (currentUser && currentUser.id) {
        await addDoc(collection(db, 'users', currentUser.id, 'orders'), {
          orderId: orderRef.id,
          paymentIntentId,
          amount,
          status: 'paid',
          createdAt: now,
          shippingDetails: {
            name: customerInfo.name || currentUser?.displayName,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            zipCode: customerInfo.zipCode,
            phone: customerInfo.phone
          },
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            sizeName: item.sizeName
          }))
        });
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  const renderAddressSelection = () => {
    if (!currentUser) return null;
    
    return (
      <div className="address-selection">
        <h3>Shipping Address</h3>
        
        {loadingProfileAddress ? (
          <div className="loading-address">Loading your address...</div>
        ) : hasProfileAddress ? (
          <div className="address-options">
            <div className="address-option">
              <input
                type="radio"
                id="profile-address"
                name="address-option"
                checked={addressOption === 'profile'}
                onChange={() => handleAddressOptionChange('profile')}
              />
              <label htmlFor="profile-address">
                <span className="option-title">Use my profile address</span>
                {profileAddress && (
                  <div className="address-preview">
                    <p>{profileAddress.address}</p>
                    <p>{profileAddress.city}, {profileAddress.state} {profileAddress.zipCode}</p>
                  </div>
                )}
              </label>
            </div>
            
            <div className="address-option">
              <input
                type="radio"
                id="new-address"
                name="address-option"
                checked={addressOption === 'new'}
                onChange={() => handleAddressOptionChange('new')}
              />
              <label htmlFor="new-address">
                <span className="option-title">Use a different address</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="no-profile-address">
            <p>No address found in your profile. Please enter your shipping details below.</p>
          </div>
        )}
      </div>
    );
  };

  const renderCustomerInfoForm = () => (
    <div className="customer-info-form">
      <h3>Customer Information</h3>
      <form onSubmit={handleInfoSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your full name"
            value={customerInfo.name}
            onChange={handleCustomerInfoChange}
            className={formErrors.name ? 'error' : ''}
          />
          {formErrors.name && <span className="error-message">{formErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address*</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={customerInfo.email}
            onChange={handleCustomerInfoChange}
            className={formErrors.email ? 'error' : ''}
          />
          {formErrors.email && <span className="error-message">{formErrors.email}</span>}
        </div>

        {currentUser && renderAddressSelection()}
        
        {(!currentUser || addressOption === 'new') && (
          <>
            <div className="form-group">
              <label htmlFor="address">Street Address*</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Enter your street address"
                value={customerInfo.address}
                onChange={handleCustomerInfoChange}
                className={formErrors.address ? 'error' : ''}
              />
              {formErrors.address && <span className="error-message">{formErrors.address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City*</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="City"
                  value={customerInfo.city}
                  onChange={handleCustomerInfoChange}
                  className={formErrors.city ? 'error' : ''}
                />
                {formErrors.city && <span className="error-message">{formErrors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State*</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="State"
                  value={customerInfo.state}
                  onChange={handleCustomerInfoChange}
                  className={formErrors.state ? 'error' : ''}
                />
                {formErrors.state && <span className="error-message">{formErrors.state}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code*</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  placeholder="ZIP Code"
                  value={customerInfo.zipCode}
                  onChange={handleCustomerInfoChange}
                  className={formErrors.zipCode ? 'error' : ''}
                />
                {formErrors.zipCode && <span className="error-message">{formErrors.zipCode}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number*</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Phone number"
                value={customerInfo.phone}
                onChange={handleCustomerInfoChange}
                className={formErrors.phone ? 'error' : ''}
              />
              {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
            </div>
          </>
        )}

        <button
          type="submit"
          className="payment-button"
          disabled={isProcessing}
        >
          Continue to Payment
        </button>
      </form>
    </div>
  );

  const renderShippingOptions = () => (
    <div className="shipping-options">
      <h3>Shipping Method</h3>
      <div className="shipping-options-list">
        {shippingOptions.map((option) => (
          <div 
            key={option.id} 
            className={`shipping-option ${selectedShipping === option.id ? 'selected' : ''}`}
            onClick={() => setSelectedShipping(option.id)}
          >
            <div className="shipping-option-header">
              <input
                type="radio"
                name="shipping"
                checked={selectedShipping === option.id}
                onChange={() => setSelectedShipping(option.id)}
              />
              <label>
                <div className="shipping-name">{option.name}</div>
                <div className="shipping-delivery">{option.estimatedDelivery}</div>
              </label>
            </div>
            <div className="shipping-price">
              {option.price > 0 ? `$${option.price.toFixed(2)}` : 'Free'}
            </div>
          </div>
        ))}
      </div>
      <div className="shipping-notice">
        {selectedShipping === 'standard' && amount >= 200 && (
          <p className="free-shipping-notice">🎉 You qualify for free standard shipping!</p>
        )}
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <>
      <h3>Payment Information</h3>
      
      {!clientSecret ? (
        <div className="loading-payment">
          {paymentError ? (
            <div className="payment-error">
              {paymentError}
              <button onClick={createPaymentIntent} className="retry-button">
                Retry
              </button>
            </div>
          ) : (
            <p>Initializing payment...</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group card-element-container">
            <label htmlFor="card-element">Credit or debit card</label>
            <div className="card-element-wrapper">
              <CardElement id="card-element" options={cardElementOptions} />
            </div>
          </div>

          {paymentError && (
            <div className="payment-error">
              {paymentError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!stripe || isProcessing || !clientSecret}
            className="payment-button"
          >
            {isProcessing ? 'Processing...' : `Pay $${(amount + shippingCost).toFixed(2)}`}
          </button>
        </form>
      )}
    </>
  );

  return (
    <div className="stripe-payment-container">
      {step === 'info' ? (
        renderCustomerInfoForm()
      ) : (
        <>
          {renderShippingOptions()}
          {renderPaymentForm()}
        </>
      )}
    </div>
  );
};

export default StripePayment;
