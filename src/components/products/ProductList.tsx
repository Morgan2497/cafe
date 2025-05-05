import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';

interface SizeOption {
  id: string;
  name: string;
  volume: string;
  price: number;
  stock: number;
  productCode?: string;
}

interface Product {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  cost?: number;
  isFeatured?: boolean;
  description?: string;
  category_id?: string;
  inventory?: number;
  brand_id?: string;
  images?: { isPrimary: boolean; storagePath: string }[];
  sizeOptions?: SizeOption[];
  [key: string]: any;
}

interface ProductListProps {
  featuredOnly?: boolean;
  searchTerm?: string;
  categoryId?: string;
}

const ProductList: React.FC<ProductListProps> = ({ featuredOnly = false, searchTerm = '', categoryId = '' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const getProductName = (product: Product): string => {
    return product.name || product.title || 'Unnamed Product';
  };

  const getProductPrice = (product: Product): number => {
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      const prices = product.sizeOptions.map(size => size.price);
      return Math.min(...prices);
    }
    return product.price || product.cost || 0;
  };

  const getPriceDisplay = (product: Product): string => {
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      const prices = product.sizeOptions.map(size => size.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice
        ? `$${minPrice.toFixed(2)}`
        : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
    return `$${getProductPrice(product).toFixed(2)}`;
  };

  const getProductImage = (product: Product): string => {
    if (product.id && imageUrls[product.id]) {
      return imageUrls[product.id];
    }
    return 'https://placehold.co/300x200?text=Loading...';
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const productsRef = collection(db, 'products');
        
        // Products may use categoryId or category_id field
        let querySnapshot;
        if (categoryId) {
          // First try querying with categoryId
          const categoryIdQuery = query(productsRef, where('categoryId', '==', categoryId));
          querySnapshot = await getDocs(categoryIdQuery);
          
          // If no results, try with category_id
          if (querySnapshot.empty) {
            const categoryIdAltQuery = query(productsRef, where('category_id', '==', categoryId));
            querySnapshot = await getDocs(categoryIdAltQuery);
          }
        } else {
          // If featuredOnly is true, apply that filter
          if (featuredOnly) {
            const featuredQuery = query(productsRef, where('isFeatured', '==', true));
            querySnapshot = await getDocs(featuredQuery);
          } else {
            querySnapshot = await getDocs(productsRef);
          }
        }
        
        const productsList: Product[] = [];

        querySnapshot.forEach((doc) => {
          productsList.push({ id: doc.id, ...doc.data() });
        });

        if (productsList.length > 0) {
          setProducts(productsList);
          setFilteredProducts(productsList);
        } else {
          setError('No products found matching the criteria.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('An unexpected error occurred while fetching products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [featuredOnly, categoryId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      const filtered = products.filter(product => {
        const productName = getProductName(product).toLowerCase();
        const productDescription = (product.description || '').toLowerCase();
        return productName.includes(lowercaseSearchTerm) || productDescription.includes(lowercaseSearchTerm);
      });
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    const fetchImageUrls = async () => {
      const newImageUrls: Record<string, string> = {};
      for (const product of products) {
        try {
          if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
            if (primaryImage && primaryImage.storagePath) {
              if (primaryImage.storagePath.startsWith('gs://')) {
                const storageRef = ref(storage, primaryImage.storagePath);
                const url = await getDownloadURL(storageRef);
                newImageUrls[product.id] = url;
              } else {
                newImageUrls[product.id] = primaryImage.storagePath;
              }
            } else {
              newImageUrls[product.id] = 'https://placehold.co/300x200?text=No+Image';
            }
          } else {
            newImageUrls[product.id] = 'https://placehold.co/300x200?text=No+Image';
          }
        } catch (error) {
          console.error(`Error loading image for product ${product.id}:`, error);
          newImageUrls[product.id] = 'https://placehold.co/300x200?text=Error';
        }
      }
      setImageUrls(newImageUrls);
    };

    if (products.length > 0) {
      fetchImageUrls();
    }
  }, [products]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><p>Loading products...</p></div>;
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

  if (filteredProducts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><p>No products match your search.</p></div>;
  }

  return (
    <div className="product-grid">
      {filteredProducts.map(product => (
        <div key={product.id} className="product-card">
          <Link to={`/products/${product.id}`} className="product-link">
            <div
              className="product-image"
              style={{ backgroundImage: `url(${getProductImage(product)})` }}
            />
            <div className="product-info">
              <h3>{getProductName(product)}</h3>
              <p>{getPriceDisplay(product)}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ProductList;

