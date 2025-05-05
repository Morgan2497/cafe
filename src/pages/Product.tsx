import React, { useState } from 'react';
import ProductList from '../components/products/ProductList';

const ProductPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container">
      <section className="product-header">
        <h1>Premium Oil is sold here!</h1>
        <p>We love to sell the best products :)</p>
      </section>
      
      <section className="product-filters">
        <div className="filter-container">
          <div className="search-box">
            <h3>Search Products</h3>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button className="search-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="all-products">
        <h2>All Products</h2>
        <ProductList searchTerm={searchTerm} />
      </section>
    </div>
  );
};

export default ProductPage; 