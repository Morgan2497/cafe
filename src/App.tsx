import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import ProductPage from './pages/Product';
import SupportPage from './pages/Support';
import ProductDetail from './pages/ProductDetail';
import AdminPage from './pages/Admin';
import ProfilePage from './pages/Profile/index';
import Logo from './components/layout/Logo';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { auth, createUserWithEmailAndPassword } from './services/firebase';
import CartPage from './pages/CartPage';
import { CartProvider, useCart } from './contexts/CartContext';
import StripeCheckoutPage from './pages/StripeCheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ChatbotWidget from './components/ChatbotWidget';

// Main app component that uses context
const AppContent: React.FC = () => {
  console.log('App component rendering');

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { currentUser, login, signup } = useAuth();
  const { cart } = useCart();
  console.log('Auth loaded, currentUser:', currentUser);

  // Create admin account if it doesn't exist
  useEffect(() => {
    const createAdminAccount = async () => {
      try {
        await createUserWithEmailAndPassword(auth, 'admin@cpsc449.com', 'admin123');
        console.log('Admin account created successfully');
      } catch (error: any) {
        // If the error is about the account already existing, that's okay
        if (error.code === 'auth/email-already-in-use') {
          console.log('Admin account already exists');
        } else {
          console.error('Error creating admin account:', error);
        }
      }
    };

    createAdminAccount();
  }, []);

  // Check if user is admin
  const isAdmin = currentUser && (currentUser.isAdmin === true || currentUser.email === "admin@cpsc449.com");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const { error } = await login(email, password);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An unexpected error occurred during login');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const { error } = await signup(email, password, name);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setShowSignupForm(false);
      setEmail('');
      setPassword('');
      setName('');
      alert('Account created successfully!');
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage('An unexpected error occurred during signup');
    }
  };

  // Auth form modal content
  const renderAuthForm = (isLogin: boolean) => {
    const formTitle = isLogin ? 'Login' : 'Sign Up';
    const handleSubmit = isLogin ? handleLogin : handleSignup;
    const switchMessage = isLogin
      ? "Don't have an account?"
      : "Already have an account?";
    const switchAction = isLogin
      ? () => {
        setShowLoginForm(false);
        setShowSignupForm(true);
        setErrorMessage(null);
      }
      : () => {
        setShowSignupForm(false);
        setShowLoginForm(true);
        setErrorMessage(null);
      };
    const switchButtonText = isLogin ? 'Sign Up' : 'Login';

    return (
      <div className="login-modal" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>{formTitle}</h2>

          {errorMessage && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                  Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  isLogin ? setShowLoginForm(false) : setShowSignupForm(false);
                  setErrorMessage(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f1f1f1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {formTitle}
              </button>
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem' }}>
                {switchMessage}
              </p>
              <button
                type="button"
                onClick={switchAction}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#3498db',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                {switchButtonText}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="navbar-logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Logo size="medium" />
            </Link>
          </div>
          <ul className="navbar-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/support">Support</Link></li>
            {isAdmin && (
              <li>
                <Link to="/admin" className="admin-link">Admin</Link>
              </li>
            )}
            {currentUser && (
              <li><Link to="/profile">{currentUser.name || 'Profile'}</Link></li>
            )}
            {!currentUser && (
              <li>
                <button
                  onClick={() => setShowLoginForm(true)}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
              </li>
            )}
            <li>
              <Link to="/cart" className="cart-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cart.length > 0 && (
                  <span className="cart-count-badge">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Auth Forms */}
        {showLoginForm && renderAuthForm(true)}
        {showSignupForm && renderAuthForm(false)}

        <main className="main-content">

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/stripe-checkout" element={<StripeCheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
          </Routes>
          <ChatbotWidget />
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">
              <Logo size="large" />
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/support">Support</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

// Wrap the app with all required providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
