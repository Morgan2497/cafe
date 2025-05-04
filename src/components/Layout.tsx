// ~/cafeteria/src/components/Layout.tsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const [cart, setCart] = useState<number>(0);

  const handleAddToCart = () => {
    setCart(prevCart => prevCart + 1);
  };

  return (
    <div>
      <Navbar cartCount={cart} /> {/* Pass the cart count as a prop */}
      <div className="content">
        <Outlet context={{ handleAddToCart: handleAddToCart }} /> {/* Pass the function via context */}
      </div>
    </div>
  );
};

export default Layout;