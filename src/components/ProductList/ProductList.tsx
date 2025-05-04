// src/components/ProductList/ProductList.tsx
import React from 'react';
import styles from './ProductList.module.css'; // If you want to use CSS Modules for styling

interface ProductListProps {
  categoryId?: string; // Optional prop to filter products by category
}

const ProductList: React.FC<ProductListProps> = ({ categoryId }) => {
  return (
    <div className={styles['product-list']}>
      {categoryId ? (
        <p>Displaying products for category: {categoryId}</p>
      ) : (
        <p>Displaying all products.</p>
      )}
      {/* Eventually, you will map through your product data here */}
    </div>
  );
};

export default ProductList;