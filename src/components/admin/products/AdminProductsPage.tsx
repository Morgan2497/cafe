import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../services/firebase';
import ProductForm from './ProductForm';
import './AdminProducts.css';

interface SizeOption {
  id: string;
  name: string;
  volume: string;
  price: number;
  stock: number; // Changed from inStock boolean to stock quantity
  productCode?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  productCode?: string;
  categoryId?: string;
  category?: string;
  brandId?: string;
  brand?: string;
  images?: { isPrimary: boolean; storagePath: string; alt?: string }[];
  isActive?: boolean;
  sizeOptions?: SizeOption[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch products, categories, and brands
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData: Product[] = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(productsData);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData: Category[] = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().title || 'Unnamed Category'
        } as Category));
        setCategories(categoriesData);

        // Fetch brands
        const brandsSnapshot = await getDocs(collection(db, 'brands'));
        const brandsData: Brand[] = brandsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Brand'
        } as Brand));
        setBrands(brandsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `product_images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress can be tracked here if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Error handling
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Handle product creation
  const handleCreateProduct = async (product: Omit<Product, 'id'>, imageFile: File | null) => {
    try {
      // Process image upload if provided
      let newProduct = { ...product };

      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        newProduct.images = [
          { isPrimary: true, storagePath: imageUrl, alt: product.name }
        ];
      }

      // Add the new product to Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update local state
      setProducts([...products, { ...newProduct, id: docRef.id } as Product]);

      // Reset form
      setIsAdding(false);
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product. Please try again.');
      return false;
    }
  };

  // Handle product update
  const handleUpdateProduct = async (product: Product, imageFile: File | null) => {
    if (!product.id) return false;

    try {
      let updatedProduct = { ...product };

      // Process image upload if provided
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        updatedProduct.images = [
          ...(updatedProduct.images || []).filter(img => !img.isPrimary),
          { isPrimary: true, storagePath: imageUrl, alt: product.name }
        ];
      }

      // Update the product in Firestore
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        ...updatedProduct,
        updatedAt: new Date()
      });

      // Update local state
      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));

      // Reset form
      setEditingProduct(null);
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
      return false;
    }
  };

  // Delete confirmation
  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirmation(true);
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteConfirmation(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    }
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // Calculate total stock across all size options
  const getTotalStock = (product: Product): number => {
    if (!product.sizeOptions || product.sizeOptions.length === 0) return 0;
    return product.sizeOptions.reduce((total, size) => total + size.stock, 0);
  };

  // Get price range if multiple sizes exist
  const getPriceRange = (product: Product): string => {
    if (!product.sizeOptions || product.sizeOptions.length === 0) {
      return 'No price';
    }
    
    if (product.sizeOptions.length === 1) {
      return formatPrice(product.sizeOptions[0].price);
    }
    
    const prices = product.sizeOptions.map(size => size.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }
    
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  // Format size options for display
  const formatSizeOptions = (product: Product): string => {
    if (!product.sizeOptions || product.sizeOptions.length === 0) {
      return 'No sizes';
    }
    
    return product.sizeOptions
      .map(size => `${size.name} (${size.volume})`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="admin-products admin-panel">
        <h2>Products Management</h2>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="admin-products admin-panel">
      <h2>Products Management</h2>
      
      {error && <div className="admin-error-message">{error}</div>}
      
      {/* Add Product Button */}
      {!isAdding && !editingProduct && (
        <button 
          className="add-product-btn" 
          onClick={() => setIsAdding(true)}
        >
          Add New Product
        </button>
      )}
      
      {/* Product Form for Adding */}
      {isAdding && (
        <div className="product-form-container">
          <h3>Add New Product</h3>
          <ProductForm
            categories={categories}
            brands={brands}
            onSubmit={(product, imageFile) => handleCreateProduct(product, imageFile)}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}
      
      {/* Product Form for Editing */}
      {editingProduct && (
        <div className="product-form-container">
          <h3>Edit Product</h3>
          <ProductForm
            initialData={editingProduct}
            categories={categories}
            brands={brands}
            onSubmit={(product, imageFile) => handleUpdateProduct(product as Product, imageFile)}
            onCancel={() => setEditingProduct(null)}
          />
        </div>
      )}
      
      {/* Products Table */}
      {!isAdding && !editingProduct && (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Product Code</th>
                <th>Price Range</th>
                <th>Total Stock</th>
                <th>Sizes</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map(product => {
                  // Get category and brand names (either from text fields or lookup by ID)
                  const categoryName = product.category || 
                    (product.categoryId && categories.find(c => c.id === product.categoryId)?.name) || 
                    'Not categorized';
                  
                  const brandName = product.brand || 
                    (product.brandId && brands.find(b => b.id === product.brandId)?.name) || 
                    'No brand';
                  
                  return (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.productCode || '-'}</td>
                      <td>{getPriceRange(product)}</td>
                      <td>{getTotalStock(product)}</td>
                      <td>{formatSizeOptions(product)}</td>
                      <td>{categoryName}</td>
                      <td>{brandName}</td>
                      <td>
                        <button 
                          className="edit-btn"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => confirmDelete(product)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && productToDelete && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete '{productToDelete.name}'?</p>
            <p>This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setProductToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteProduct}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;