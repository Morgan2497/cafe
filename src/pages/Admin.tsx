import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OrdersList from '../components/orders/OrdersList';
import AdminProductsPage from '../components/admin/products/AdminProductsPage';
import MessagesList from '../components/admin/messages/MessagesList';
import UsersList from '../components/admin/users/UsersList';
import DataReferenceUpload from '../components/admin/dataReferences/DataReferenceUpload';

const AdminPage: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState('orders'); // Default to orders tab
  const { currentUser } = useAuth();
  
  // Check if user is admin (either by email or isAdmin flag)
  const isAdmin = currentUser && (currentUser.isAdmin === true || currentUser.email === "admin@cpsc449.com");
  
  // Redirect if not an admin
  if (!currentUser || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container">
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        
        {/* Admin Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeAdminTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('orders')}
          >
            Orders
          </button>
          <button 
            className={`admin-tab ${activeAdminTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('products')}
          >
            Products
          </button>
          <button 
            className={`admin-tab ${activeAdminTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('users')}
          >
            Users
          </button>
          <button 
            className={`admin-tab ${activeAdminTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('messages')}
          >
            Messages
          </button>
          <button 
            className={`admin-tab ${activeAdminTab === 'data-references' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('data-references')}
          >
            Data References
          </button>
        </div>
        
        {/* Admin Panel Content */}
        <div className="admin-panels">
          {activeAdminTab === 'orders' && (
            <div className="admin-panel">
              <OrdersList />
            </div>
          )}
          
          {activeAdminTab === 'products' && (
            <AdminProductsPage />
          )}
          
          {activeAdminTab === 'users' && (
            <div className="admin-panel">
              <UsersList />
            </div>
          )}
          
          {activeAdminTab === 'messages' && (
            <div className="admin-panel">
              <MessagesList />
            </div>
          )}
          
          {activeAdminTab === 'data-references' && (
            <div className="admin-panel">
              <DataReferenceUpload />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;