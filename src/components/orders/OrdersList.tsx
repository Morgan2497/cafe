import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Order {
  id: number | string;
  customer_email?: string;
  order_date?: string;
  status?: string;
  total?: number;
  items_count?: number;
  [key: string]: any; // Allow any other properties
}

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching orders from Firestore 'orders' collection...");

        // Create a reference to the orders collection
        const ordersRef = collection(db, 'orders');
        // Query orders, ordered by order_date in descending order
        const ordersQuery = query(ordersRef, orderBy('order_date', 'desc'));
        const querySnapshot = await getDocs(ordersQuery);
        
        const ordersList: Order[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordersList.push({
            id: doc.id,
            ...data,
            // Format order_date if needed
            order_date: data.order_date ? new Date(data.order_date).toISOString().split('T')[0] : ''
          });
        });
        
        console.log(`Found ${ordersList.length} orders in Firestore`);
        
        if (ordersList.length > 0) {
          setOrders(ordersList);
        } else {
          setError('No orders found in the database. Please check the "orders" collection in Firestore.');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '4px' 
      }}>
        <p>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No orders found.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Recent Orders</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Order ID</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Customer</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>#{order.id}</td>
              <td style={{ padding: '10px' }}>{order.customer_email}</td>
              <td style={{ padding: '10px' }}>{order.order_date}</td>
              <td style={{ padding: '10px' }}>
                <span
                  style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    backgroundColor: 
                      order.status === 'Delivered' ? '#c8e6c9' : 
                      order.status === 'Shipped' ? '#bbdefb' : 
                      order.status === 'Processing' ? '#fff9c4' : 
                      '#ffccbc',
                    color: 
                      order.status === 'Delivered' ? '#2e7d32' : 
                      order.status === 'Shipped' ? '#1565c0' : 
                      order.status === 'Processing' ? '#f9a825' : 
                      '#d84315'
                  }}
                >
                  {order.status}
                </span>
              </td>
              <td style={{ padding: '10px' }}>${order.total?.toFixed(2) || 'N/A'}</td>
              <td style={{ padding: '10px' }}>
                <button 
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    marginRight: '5px' 
                  }}
                >
                  View
                </button>
                <button 
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#2c3e50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px' 
                  }}
                >
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersList;