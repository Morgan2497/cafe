import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import './UsersList.css';

interface User {
  id: string;
  name?: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { setUserAsAdmin, removeUserAsAdmin } = useAuth();

  // Fetch all users from Firestore
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      
      const usersList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          email: data.email,
          isAdmin: data.isAdmin === true || data.email === 'admin@cpsc449.com' || data.email === 'admin@example.com',
          createdAt: data.createdAt,
        };
      });
      
      setUsers(usersList);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Promote user to admin
  const promoteToAdmin = async (userId: string) => {
    try {
      setActionInProgress(userId);
      setSuccessMessage(null);
      
      const { success, error } = await setUserAsAdmin(userId);
      
      if (success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isAdmin: true } 
              : user
          )
        );
        
        setSuccessMessage('User promoted to admin successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(error?.message || 'Failed to promote user. Please try again.');
      }
    } catch (err) {
      console.error('Error promoting user:', err);
      setError('Failed to promote user. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Demote admin to regular user
  const demoteAdmin = async (userId: string) => {
    try {
      setActionInProgress(userId);
      setSuccessMessage(null);
      
      // Don't allow demoting primary admin accounts
      const user = users.find(u => u.id === userId);
      if (user?.email === 'admin@cpsc449.com' || user?.email === 'admin@example.com') {
        setError('Cannot demote primary admin account');
        setActionInProgress(null);
        return;
      }
      
      const { success, error } = await removeUserAsAdmin(userId);
      
      if (success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isAdmin: false } 
              : user
          )
        );
        
        setSuccessMessage('User demoted to regular user successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(error?.message || 'Failed to demote user. Please try again.');
      }
    } catch (err) {
      console.error('Error demoting user:', err);
      setError('Failed to demote user. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchUsers} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="users-list-container">
      <h2>User Management</h2>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                {user.isAdmin ? (
                  <span className="admin-badge">Admin</span>
                ) : (
                  <span className="user-badge">Regular User</span>
                )}
              </td>
              <td>
                {!user.isAdmin && (
                  <button 
                    onClick={() => promoteToAdmin(user.id)}
                    disabled={actionInProgress === user.id}
                    className="promote-button"
                  >
                    {actionInProgress === user.id ? 'Processing...' : 'Promote to Admin'}
                  </button>
                )}
                {user.isAdmin && (
                  <button 
                    onClick={() => demoteAdmin(user.id)}
                    disabled={actionInProgress === user.id}
                    className="demote-button"
                  >
                    {actionInProgress === user.id ? 'Processing...' : 'Demote to User'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <p className="no-users">No users found</p>
      )}
    </div>
  );
};

export default UsersList;