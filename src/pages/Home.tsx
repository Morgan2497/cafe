import React, { useState, useEffect } from 'react';
import ProductList from '../components/products/ProductList';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';

// Category interface
interface Category {
  id: string;
  name?: string;
  title?: string;
  category_name?: string;
  description?: string;
  details?: string;
  info?: string;
  [key: string]: any;
}

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCategories, setHasCategories] = useState<boolean>(false);

  // Helper function to extract category name
  const getCategoryName = (category: Category): string => {
    return category.name || category.title || category.category_name || 'Unnamed Category';
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesRef = collection(db, 'categories');
        const querySnapshot = await getDocs(categoriesRef);
        
        const categoriesList: Category[] = [];
        querySnapshot.forEach((doc) => {
          categoriesList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        if (categoriesList.length > 0) {
          setCategories(categoriesList);
          setHasCategories(true);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to K-Motor Shop</h1>
          <p>Engineering Your Road Ahead</p>
          <Link to="/products"><button className="primary-button">Shop Now</button></Link>
          <Link to="/products"><button className="secondary-button">View All Products</button></Link>
        </div>
      </section>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading categories and products...</p>
        </div>
      ) : (
        <>
          {/* Display products by category if categories exist */}
          {hasCategories && categories.map(category => (
            <section key={category.id} className="category-products-section container">
              <h2>{getCategoryName(category)}</h2>
              <ProductList categoryId={category.id} />
            </section>
          ))}
          
          {/* Fallback: Show all products if no categories or as additional section */}
          <section className="all-products container">
            <h2>All Products</h2>
            <ProductList />
          </section>
        </>
      )}
    </>
  );
};

export default HomePage;