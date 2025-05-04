// ~/cafeteria/src/components/Navbar.tsx
import React from 'react';
import styles from './Navbar.module.css';
import { FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface NavbarProps {
  cartCount: number; // Define the prop type
}

const Navbar: React.FC<NavbarProps> = ({ cartCount }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>YourCafeteria</div>
      <ul className={styles.navLinks}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/items">Items</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/support">Support</Link></li>
      </ul>
      <div className={styles.userActions}>
        <Link to="/login">Login</Link>
        <Link to="/cart" className={styles.cartIcon}>
          <FaShoppingCart /> {cartCount > 0 && <span>({cartCount})</span>} {/* Display count if greater than 0 */}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;