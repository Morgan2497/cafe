import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useCart } from '../../contexts/CartContext';
import './ProductDetail.css'; // Import CSS file

interface SizeOption {
  id: string;
  name: string;
  price: number;
  volume: string;
  stock: number;
  productCode?: string;
}

interface Product {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  cost?: number;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  description?: string;
  category_id?: string;
  categoryId?: string;
  inventory?: number;
  stock?: number;
  brand_id?: string;
  images?: { isPrimary: boolean; storagePath: string; alt?: string }[];
  sizeOptions?: SizeOption[];
  productCode?: string;
  [key: string]: any;
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('https://placehold.co/600x400?text=No+Image');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [categoryName, setCategoryName] = useState<string>('');

  const getProductName = (product: Product): string => {
    return product.name || product.title || 'Unnamed Product';
  };

  const getProductPrice = (product: Product): number => {
    return product.price || product.cost || 0;
  };

  const getProductDescription = (product: Product): string => {
    return product.description || 'No description available.';
  };

  const isSizeInStock = (size: SizeOption): boolean => {
    return size.stock > 0;
  };

  const isAnyOptionInStock = (options: SizeOption[]): boolean => {
    return options.some(size => isSizeInStock(size));
  };

  const getProductCode = (): string => {
    if (!product) return '';
    if (selectedSizeOption && selectedSizeOption.productCode) {
      return selectedSizeOption.productCode;
    }
    return product.productCode || '';
  };

  const getCategoryName = async (categoryId: string | undefined) => {
    if (!categoryId) return;
    
    try {
      const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
      if (categoryDoc.exists()) {
        const data = categoryDoc.data();
        // Categories might store name under different fields
        return data.name || data.title || data.category_name || 'Unnamed Category';
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
    return 'Unknown Category';
  };

  const selectedSizeOption = sizeOptions.find(size => size.id === selectedSize);
  const selectedSizeInStock = selectedSizeOption ? isSizeInStock(selectedSizeOption) : false;
  const productCode = getProductCode();
  const productInStock = sizeOptions.length > 0 && isAnyOptionInStock(sizeOptions);

  const handleSizeChange = (sizeId: string) => {
    setSelectedSize(sizeId);
    const size = sizeOptions.find(size => size.id === sizeId);
    if (size) {
      setCurrentPrice(size.price);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSizeOption || !product) {
      alert("Please select a size.");
      return;
    }

    const cartItem = {
      id: `${product.id}_${selectedSizeOption.id}`,
      name: getProductName(product),
      productNumber: productCode || `${product.id}-${selectedSizeOption.id}`,
      sizeId: selectedSizeOption.id,
      sizeName: selectedSizeOption.name,
      price: selectedSizeOption.price,
      quantity: quantity,
      imageUrl: imageUrl
    };

    try {
      await addToCart(cartItem);
      alert("Item added to cart!");
    } catch (err) {
      console.error("Failed to add to cart:", err);
      alert("Failed to add item to cart.");
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const increaseQuantity = () => {
    if (selectedSizeOption && quantity < selectedSizeOption.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const productDoc = doc(db, 'products', productId);
        const productSnapshot = await getDoc(productDoc);
        if (productSnapshot.exists()) {
          // Explicitly cast to Product type to avoid TypeScript errors
          const productData: Product = {
            id: productSnapshot.id,
            ...productSnapshot.data() as Omit<Product, 'id'>
          };
          
          setProduct(productData);
          
          // Fetch category name
          const catId = productData.categoryId || productData.category_id;
          console.log("Product data:", productData);
          console.log("Category ID found:", catId);
          
          if (catId) {
            const name = await getCategoryName(catId);
            console.log("Category name fetched:", name);
            setCategoryName(name);
          } else {
            // If no category ID is found, try to display the raw category field if it exists
            if (productData.category) {
              console.log("Using raw category field:", productData.category);
              setCategoryName(productData.category);
            }
          }
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('An unexpected error occurred while fetching the product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;

    let alt = getProductName(product);
    const fetchImageUrl = async () => {
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
        if (primaryImage.alt) alt = primaryImage.alt;

        if (primaryImage.storagePath.startsWith('gs://')) {
          try {
            const storageRef = ref(storage, primaryImage.storagePath);
            const url = await getDownloadURL(storageRef);
            setImageUrl(url);
          } catch {
            setImageUrl(product.imageUrl || product.image || product.image_url || 'https://placehold.co/600x400?text=No+Image');
          }
        } else {
          setImageUrl(primaryImage.storagePath);
        }
      } else {
        setImageUrl(product.imageUrl || product.image || product.image_url || 'https://placehold.co/600x400?text=No+Image');
      }
      setImageAlt(alt);
    };

    fetchImageUrl();
  }, [product]);

  useEffect(() => {
    if (!product) return;

    let options: SizeOption[] = [];

    if (product.sizeOptions && product.sizeOptions.length > 0) {
      options = product.sizeOptions;
    } else {
      const basePrice = getProductPrice(product);
      const baseStock = product.stock || product.inventory || 0;

      options = [
        { id: 'small', name: 'Small', volume: '5 Quart', price: basePrice, stock: Math.ceil(baseStock * 0.6) },
        { id: 'medium', name: 'Medium', volume: '50 Quart (10% Off)', price: basePrice * 9, stock: Math.ceil(baseStock * 0.3) },
        { id: 'large', name: 'Large', volume: '100 Quart (20% Off)', price: basePrice * 16, stock: Math.ceil(baseStock * 0.1) }
      ];
    }

    setSizeOptions(options);
    const defaultSize = options.find(size => isSizeInStock(size)) || options[0];
    setSelectedSize(defaultSize.id);
    setCurrentPrice(defaultSize.price);
  }, [product]);

  if (loading) {
    return <div className="container"><p>Loading product details...</p></div>;
  }

  if (error || !product) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          <p>{error || 'Product could not be loaded'}</p>
          <Link to="/products" style={{ marginTop: '1rem', display: 'inline-block', backgroundColor: '#2c3e50', color: 'white', padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '4px' }}>
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="product-detail">
        <div className="breadcrumb">
          <Link to="/products">Products</Link> / {getProductName(product)}
        </div>

        <div className="product-detail-content">
          <div className="product-detail-image">
            <img src={imageUrl} alt={imageAlt} />
          </div>

          <div className="product-detail-info">
            <h1>{getProductName(product)}</h1>
            <p className="product-price">${currentPrice.toFixed(2)}</p>

            <div className="product-code">
              <p>
                {productCode && (
                  <>Product Number: <span>{productCode}</span></>
                )}
                {/* Increased spacing between product number and category with wider margin */}
                {categoryName && <span style={{ marginLeft: '7rem' }}>  Category: <strong>{categoryName}</strong></span>}
              </p>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{getProductDescription(product)}</p>
            </div>

            {sizeOptions.length > 0 && (
              <div className="product-size-selection">
                <h3>Select Size</h3>
                <div className="size-options">
                  {sizeOptions.map(size => (
                    <div key={size.id}
                      className={`size-option ${selectedSize === size.id ? 'selected' : ''} ${!isSizeInStock(size) ? 'out-of-stock' : ''}`}
                      onClick={() => isSizeInStock(size) && handleSizeChange(size.id)}
                    >
                      <div className="size-option-inner">
                        <span className="size-name">{size.name}</span>
                        <span className="size-volume">{size.volume}</span>
                        <span className="size-price">${size.price.toFixed(2)}</span>
                        {!isSizeInStock(size) && <span className="size-out-of-stock-label">Out of Stock</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="product-inventory">
              <p className="inventory-status">
                <span className={productInStock ? 'in-stock' : 'out-of-stock'}>
                  {productInStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </p>
            </div>

            <div className="product-quantity">
              <h3>Quantity</h3>
              <div className="quantity-control">
                <button 
                  className="quantity-btn" 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  className="quantity-btn" 
                  onClick={increaseQuantity}
                  disabled={selectedSizeOption ? quantity >= selectedSizeOption.stock : true}
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-actions">
              <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={!selectedSizeInStock}>
                Add to Cart
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow} disabled={!selectedSizeInStock}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;