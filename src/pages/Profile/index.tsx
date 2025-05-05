import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, orderBy, getDoc } from 'firebase/firestore';
import './Profile.css';

// Define interfaces for our data
interface Order {
  id: string;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  status?: string;
  items?: any[];
  createdAt?: any;
  paymentIntentId?: string;
  shippingDetails?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };
}

interface AddressInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

const ProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const [editingAddress, setEditingAddress] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const location = useLocation();
  
  // State for user address
  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  // Extract the fetchUserData function to make it reusable
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Fetch user's address from Firestore if it exists
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('email', '==', currentUser.email)
      ));

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.address) {
          setAddressInfo({
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zipCode || '',
            phone: userData.phone || ''
          });
        }
      }

      console.log("Fetching orders for user ID:", currentUser.id);
      
      // First try to find orders in the user's subcollection (if implemented)
      let ordersList: Order[] = [];
      try {
        const userOrdersRef = collection(db, `users/${currentUser.id}/orders`);
        const userOrdersSnapshot = await getDocs(userOrdersRef);
        
        if (!userOrdersSnapshot.empty) {
          console.log(`Found ${userOrdersSnapshot.size} orders in user's orders subcollection`);
          
          // Process each order in the subcollection
          for (const orderDoc of userOrdersSnapshot.docs) {
            const data = orderDoc.data();
            
            // If this is a reference to a main order, fetch the full order details
            if (data.orderId) {
              try {
                const mainOrderRef = doc(db, 'orders', data.orderId);
                const mainOrderDoc = await getDoc(mainOrderRef);
                
                if (mainOrderDoc.exists()) {
                  const mainOrderData = mainOrderDoc.data();
                  // Log the fetched main order data to check for shippingDetails
                  console.log("Fetched main order data:", mainOrderDoc.id, mainOrderData); 
                  ordersList.push({
                    id: mainOrderDoc.id,
                    orderId: mainOrderDoc.id,
                    orderNumber: mainOrderData.orderNumber || mainOrderDoc.id.slice(0, 8).toUpperCase(),
                    amount: mainOrderData.amount,
                    status: mainOrderData.status || 'Processing',
                    items: mainOrderData.items || [],
                    createdAt: mainOrderData.createdAt,
                    paymentIntentId: mainOrderData.paymentIntentId,
                    shippingDetails: mainOrderData.shippingDetails,
                  });
                  continue;
                }
              } catch (err) {
                console.error("Error fetching main order details:", err);
              }
            }
            
            // If we couldn't get the main order or there's no reference, use the subcollection data
            ordersList.push({
              id: orderDoc.id,
              orderId: data.orderId || orderDoc.id,
              orderNumber: data.orderNumber || orderDoc.id.slice(0, 8).toUpperCase(),
              amount: data.amount,
              status: data.status || 'Processing',
              items: data.items || [],
              createdAt: data.createdAt,
              paymentIntentId: data.paymentIntentId,
              shippingDetails: data.shippingDetails,
            });
          }
        }
      } catch (subErr) {
        console.error("Error fetching from user's orders subcollection:", subErr);
        // Continue to the next approach
      }

      // If no orders found in subcollection, try the main orders collection
      if (ordersList.length === 0) {
        // Try multiple field variations for user ID
        const possibleFields = ['userId', 'user_id', 'customerId', 'customer_id'];
        let foundOrders = false;
        
        for (const field of possibleFields) {
          if (foundOrders) break;
          
          try {
            console.log(`Attempting to query orders with field: ${field} = ${currentUser.id}`);
            // Add orderBy to ensure newest orders appear first
            const ordersQuery = query(
              collection(db, 'orders'),
              where(field, '==', currentUser.id),
              orderBy('createdAt', 'desc')
            );
            
            const ordersSnapshot = await getDocs(ordersQuery);
            
            if (!ordersSnapshot.empty) {
              console.log(`Found ${ordersSnapshot.size} orders using field ${field}`);
              foundOrders = true;
              
              ordersSnapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`Order ${doc.id} data:`, data);
                ordersList.push({
                  id: doc.id,
                  orderId: doc.id,
                  orderNumber: data.orderNumber || doc.id.slice(0, 8).toUpperCase(),
                  amount: data.amount,
                  status: data.status || 'Processing',
                  items: data.items || [],
                  createdAt: data.createdAt,
                  shippingDetails: data.shippingDetails,
                  paymentIntentId: data.paymentIntentId,
                });
              });
            }
          } catch (fieldErr) {
            console.error(`Error querying with field ${field}:`, fieldErr);
            // Try without orderBy if it's causing issues
            try {
              console.log(`Retrying without orderBy: ${field} = ${currentUser.id}`);
              const simpleQuery = query(
                collection(db, 'orders'),
                where(field, '==', currentUser.id)
              );
              
              const simpleSnapshot = await getDocs(simpleQuery);
              
              if (!simpleSnapshot.empty) {
                console.log(`Found ${simpleSnapshot.size} orders using simple query with field ${field}`);
                foundOrders = true;
                
                simpleSnapshot.forEach((doc) => {
                  const data = doc.data();
                  console.log(`Order ${doc.id} data:`, data);
                  ordersList.push({
                    id: doc.id,
                    orderId: doc.id,
                    orderNumber: data.orderNumber || doc.id.slice(0, 8).toUpperCase(),
                    amount: data.amount,
                    status: data.status || 'Processing',
                    items: data.items || [],
                    createdAt: data.createdAt,
                    shippingDetails: data.shippingDetails,
                    paymentIntentId: data.paymentIntentId,
                  });
                });
              }
            } catch (simpleErr) {
              console.error(`Error with simple query for field ${field}:`, simpleErr);
            }
          }
        }

        // Also try by user email as a fallback
        if (!foundOrders && currentUser.email) {
          try {
            console.log(`Attempting to query orders with email = ${currentUser.email}`);
            const emailQuery = query(
              collection(db, 'orders'),
              where('customer_email', '==', currentUser.email)
            );
            
            const emailOrdersSnapshot = await getDocs(emailQuery);
            
            if (!emailOrdersSnapshot.empty) {
              console.log(`Found ${emailOrdersSnapshot.size} orders using email`);
              foundOrders = true;
              
              emailOrdersSnapshot.forEach((doc) => {
                const data = doc.data();
                ordersList.push({
                  id: doc.id,
                  orderId: doc.id,
                  orderNumber: data.orderNumber || doc.id.slice(0, 8).toUpperCase(),
                  amount: data.amount || data.total,
                  status: data.status || 'Processing',
                  items: data.items || [],
                  createdAt: data.createdAt || data.order_date,
                  shippingDetails: data.shippingDetails,
                  paymentIntentId: data.paymentIntentId,
                });
              });
            }
          } catch (emailErr) {
            console.error("Error querying by email:", emailErr);
          }
        }
      }
      
      // Set orders if any were found
      if (ordersList.length > 0) {
        console.log("Setting orders:", ordersList);
        
        // Sort orders by creation date (newest first) if createdAt exists
        ordersList.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          
          return dateB.getTime() - dateA.getTime();
        });
        
        setOrders(ordersList);
        
        // If coming from payment success, switch to orders tab
        if (location.search.includes('payment_success=true')) {
          setActiveTab('orders');
        }
      } else {
        console.log("No orders found for user");
        // Not setting an error, as having no orders is a valid state
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setOrderError('Failed to load your order history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, location.search]);

  // Fetch user's address and orders when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, fetchUserData]);

  // Check if we're coming from a successful payment
  useEffect(() => {
    if (location.search.includes('payment_success=true')) {
      // Switch to orders tab
      setActiveTab('orders');
    }
  }, [location.search]);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveAddress = async () => {
    if (!currentUser) return;
    
    try {
      // Update the user's document with address information
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('email', '==', currentUser.email)
      ));

      if (!userDoc.empty) {
        const userRef = doc(db, 'users', userDoc.docs[0].id);
        await updateDoc(userRef, {
          address: addressInfo.address,
          city: addressInfo.city,
          state: addressInfo.state,
          zipCode: addressInfo.zipCode,
          phone: addressInfo.phone,
          updatedAt: new Date()
        });
      } else {
        // If user document doesn't exist yet, create it
        await setDoc(doc(db, 'users', currentUser.id), {
          name: currentUser.name || currentUser.displayName,
          email: currentUser.email,
          address: addressInfo.address,
          city: addressInfo.city,
          state: addressInfo.state,
          zipCode: addressInfo.zipCode,
          phone: addressInfo.phone,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      setEditingAddress(false);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleViewOrderDetail = (order: Order) => {
    console.log("Viewing order details:", order);
    setSelectedOrder(order);
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
  };

  const refreshOrders = () => {
    fetchUserData();
  };

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;

    console.log("Rendering order details for:", selectedOrder);

    return (
      <div className="order-detail-view">
        <div className="order-detail-header">
          <button className="back-button" onClick={handleBackToOrders}>
            <span>←</span> Back to Orders
          </button>
          <h2>Order #{selectedOrder.orderNumber}</h2>
        </div>

        <div className="order-detail-summary">
          <div>
            <div className="detail-group">
              <h4>Order Date</h4>
              <p>{formatDate(selectedOrder.createdAt)}</p>
            </div>
            <div className="detail-group">
              <h4>Status</h4>
              <p className={`status-badge ${selectedOrder.status?.toLowerCase()}`}>
                {selectedOrder.status}
              </p>
            </div>
            {selectedOrder.paymentIntentId && (
              <div className="detail-group">
                <h4>Payment ID</h4>
                <p className="payment-id">{selectedOrder.paymentIntentId}</p>
              </div>
            )}
          </div>
          
          <div className="divider"></div>
          
          <div className="shipping-details">
            <h3>Shipping Address</h3>
            {selectedOrder.shippingDetails ? (
              <>
                <p>{selectedOrder.shippingDetails.name || 'No name provided'}</p>
                <p>{selectedOrder.shippingDetails.address || 'No address provided'}</p>
                <p>
                  {selectedOrder.shippingDetails.city || 'No city provided'}{selectedOrder.shippingDetails.city ? ',' : ''} 
                  {selectedOrder.shippingDetails.state || 'No state provided'} 
                  {selectedOrder.shippingDetails.zipCode || 'No ZIP provided'}
                </p>
                {selectedOrder.shippingDetails.phone && (
                  <p>Phone: {selectedOrder.shippingDetails.phone}</p>
                )}
              </>
            ) : (
              <p>No shipping details available</p>
            )}
          </div>
        </div>

        <div className="order-detail-items">
          <h3>Order Items</h3>
          
          {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
            <>
              <div className="item-list-header">
                <div>Product</div>
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
              </div>
              
              <div className="item-list">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="ordered-item">
                    <div className="item-product">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name || 'Product'} />}
                      <div className="item-details">
                        <h4>{item.name || 'Unknown Product'}</h4>
                        {item.sizeName && <p>Size: {item.sizeName}</p>}
                        {item.colorName && <p>Color: {item.colorName}</p>}
                      </div>
                    </div>
                    <div className="item-price">${Number(item.price || 0).toFixed(2)}</div>
                    <div className="item-quantity">{item.quantity || 1}</div>
                    <div className="item-total">
                      ${Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-detail-totals">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>${selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="totals-row total">
                  <span>Total</span>
                  <span>${selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="no-items">No items found for this order. Please contact support if this is unexpected.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Your Account</h1>
        
        {/* Profile Navigation Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Personal Info
          </button>
          <button 
            className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Order History
          </button>
        </div>
        
        {/* Personal Info Tab (merged with Address) */}
        {activeTab === 'info' && (
          <div className="profile-info">
            <div className="info-group">
              <h3>Name</h3>
              <p>{currentUser.name || currentUser.displayName || 'Not provided'}</p>
            </div>

            <div className="info-group">
              <h3>Email</h3>
              <p>{currentUser.email}</p>
            </div>

            {currentUser.isAdmin && (
              <div className="info-group">
                <span className="admin-badge">Admin User</span>
              </div>
            )}
            
            {/* Address section (now part of Personal Info) */}
            <div className="address-section">
              <h3>Your Address</h3>
              {!editingAddress ? (
                <>
                  <div className="address-display">
                    {addressInfo.address ? (
                      <>
                        <div className="info-group">
                          <h3>Street Address</h3>
                          <p>{addressInfo.address}</p>
                        </div>
                        <div className="info-group">
                          <h3>City</h3>
                          <p>{addressInfo.city}</p>
                        </div>
                        <div className="info-group">
                          <h3>State</h3>
                          <p>{addressInfo.state}</p>
                        </div>
                        <div className="info-group">
                          <h3>ZIP Code</h3>
                          <p>{addressInfo.zipCode}</p>
                        </div>
                        <div className="info-group">
                          <h3>Phone</h3>
                          <p>{addressInfo.phone}</p>
                        </div>
                      </>
                    ) : (
                      <div className="no-address">
                        <p>You haven't added your address yet.</p>
                      </div>
                    )}
                    <button 
                      className="edit-address-btn"
                      onClick={() => setEditingAddress(true)}
                    >
                      {addressInfo.address ? 'Edit Address' : 'Add Address'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="address-form">
                  <h3>Your Address</h3>
                  <div className="form-group">
                    <label htmlFor="address">Street Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={addressInfo.address}
                      onChange={handleAddressChange}
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={addressInfo.city}
                        onChange={handleAddressChange}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={addressInfo.state}
                        onChange={handleAddressChange}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={addressInfo.zipCode}
                        onChange={handleAddressChange}
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={addressInfo.phone}
                        onChange={handleAddressChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="address-actions">
                    <button className="cancel-btn" onClick={() => setEditingAddress(false)}>
                      Cancel
                    </button>
                    <button className="save-btn" onClick={saveAddress}>
                      Save Address
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="logout-section">
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="profile-orders">
            {selectedOrder ? (
              renderOrderDetail()
            ) : (
              <>
                <div className="orders-header">
                  <h3>Your Orders</h3>
                  <button className="refresh-orders-btn" onClick={refreshOrders}>
                    Refresh Orders
                  </button>
                </div>
                
                {loading ? (
                  <div className="loading">Loading your orders...</div>
                ) : orderError ? (
                  <div className="error">{orderError}</div>
                ) : orders.length > 0 ? (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div 
                        key={order.id} 
                        className={`order-item ${location.search.includes('payment_success=true') && orders.indexOf(order) === 0 ? 'highlight-new-order' : ''}`}
                        onClick={() => handleViewOrderDetail(order)}
                      >
                        <div className="order-header">
                          <div className="order-id">
                            <span>Order #{order.orderNumber}</span>
                          </div>
                          <div className="order-date">
                            <span>Placed on {formatDate(order.createdAt)}</span>
                          </div>
                          <div className="order-status">
                            <span className={`status-badge ${order.status?.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="order-details">
                          <div className="order-items">
                            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                              order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="order-product">
                                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
                                  <div className="product-details">
                                    <h4>{item.name || 'Product'}</h4>
                                    <p>Quantity: {item.quantity || 1}</p>
                                    {item.sizeName && <p>Size: {item.sizeName}</p>}
                                    <p>${Number(item.price || 0).toFixed(2)}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p>No items found for this order.</p>
                            )}
                            {order.items && Array.isArray(order.items) && order.items.length > 3 && (
                              <div className="more-items">
                                +{order.items.length - 3} more items
                              </div>
                            )}
                          </div>
                          
                          <div className="order-summary">
                            <div className="total">
                              <h4>Total:</h4>
                              <span>${order.amount?.toFixed(2) || '0.00'}</span>
                            </div>
                            {order.shippingDetails && (
                              <div className="shipping-info">
                                <h4>Shipped to:</h4>
                                {order.shippingDetails.name && <p>{order.shippingDetails.name}</p>}
                                {order.shippingDetails.address && <p>{order.shippingDetails.address}</p>}
                                <p>
                                  {order.shippingDetails.city || ''}{order.shippingDetails.city ? ', ' : ''}
                                  {order.shippingDetails.state || ''} {order.shippingDetails.zipCode || ''}
                                </p>
                              </div>
                            )}
                            <div className="view-details-link">View Order Details →</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-orders">
                    <p>You haven't placed any orders yet.</p>
                    <a href="/" className="shop-now-btn">Shop Now</a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;