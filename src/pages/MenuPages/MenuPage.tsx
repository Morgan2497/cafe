import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './MenuPage.css'; // Import the CSS file

const MenuPage = () => {
  return (
    <div className="menu-page">
      <header className="menu-header">
        <h1 className="menu-title">Our Menu</h1>
        <p className="menu-description">Explore our delicious selections!</p>
      </header>
      <nav className="menu-nav">
        <ul className="menu-nav-list">
          <li className="menu-nav-item">
            <Link to="main-food" className="menu-nav-link">Main Food</Link>
          </li>
          <li className="menu-nav-item">
            <Link to="drinks" className="menu-nav-link">Drinks</Link>
          </li>
          <li className="menu-nav-item">
            <Link to="dessert" className="menu-nav-link">Dessert</Link>
          </li>
          <li className="menu-nav-item">
            <Link to="combo" className="menu-nav-link">Combo Menu</Link>
          </li>
        </ul>
      </nav>

      <main className="menu-content">
        <Outlet />
      </main>

      <footer className="menu-footer">
        <p>Enjoy your meal!</p>
      </footer>
    </div>
  );
};

export default MenuPage;
