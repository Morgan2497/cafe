import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
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
  id?: string;
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

interface ProductFormProps {
  initialData?: Product;
  categories: Category[];
  brands: Brand[];
  onSubmit: (product: Product, imageFile: File | null) => Promise<boolean>;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  brands,
  onSubmit,
  onCancel
}) => {
  const defaultProduct: Product = {
    name: '',
    description: '',
    productCode: '',
    category: '',
    brand: '',
    isActive: true,
    sizeOptions: [
      {
        id: 'small',
        name: 'Small',
        volume: '5 Quart',
        price: 0,
        stock: 0, // Default stock quantity
        productCode: ''
      }
    ]
  };

  const [product, setProduct] = useState<Product>(initialData || defaultProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for managing size options
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>(
    initialData?.sizeOptions || defaultProduct.sizeOptions || []
  );

  // Set image preview if product has existing image
  useEffect(() => {
    if (initialData && initialData.images && initialData.images.length > 0) {
      const primaryImage = initialData.images.find(img => img.isPrimary) || initialData.images[0];
      if (primaryImage && primaryImage.storagePath) {
        setImagePreview(primaryImage.storagePath);
      }
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle size option change
  const handleSizeOptionChange = (index: number, field: keyof SizeOption, value: string | number | boolean) => {
    const updatedSizeOptions = [...sizeOptions];
    
    if (field === 'price' || field === 'stock') {
      updatedSizeOptions[index][field] = parseFloat(value as string) || 0;
    } else if (typeof updatedSizeOptions[index][field] === 'string') {
      updatedSizeOptions[index][field] = value as string;
    } else {
      // Handle other types appropriately
      (updatedSizeOptions[index] as any)[field] = value;
    }
    
    setSizeOptions(updatedSizeOptions);
  };

  // Add new size option
  const addSizeOption = () => {
    const newId = `size-${Date.now()}`;
    setSizeOptions([...sizeOptions, {
      id: newId,
      name: 'New Size',
      volume: 'Volume',
      price: 0, // Default price
      stock: 0, // Default stock
      productCode: ''
    }]);
  };

  // Remove size option
  const removeSizeOption = (index: number) => {
    const updatedSizeOptions = [...sizeOptions];
    updatedSizeOptions.splice(index, 1);
    setSizeOptions(updatedSizeOptions);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Include size options in the product data
      const productWithSizes = {
        ...product,
        sizeOptions
      };

      const success = await onSubmit(productWithSizes, imageFile);
      if (success) {
        // Reset form
        if (!initialData) {
          setProduct(defaultProduct);
          setImageFile(null);
          setImagePreview(null);
          setSizeOptions(defaultProduct.sizeOptions || []);
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Product Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="productCode">Product Code</label>
          <input
            type="text"
            id="productCode"
            name="productCode"
            value={product.productCode || ''}
            onChange={handleChange}
            placeholder="Enter product code/number"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={product.description}
          onChange={handleChange}
          rows={5}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={product.category || ''}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="brand">Brand</label>
          <select
            id="brand"
            name="brand"
            value={product.brand || ''}
            onChange={handleChange}
          >
            <option value="">Select a brand</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="productImage">Product Image</label>
        <input
          type="file"
          id="productImage"
          name="productImage"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Product preview" />
          </div>
        )}
      </div>
      
      {/* Size Options Section */}
      <div className="form-group size-options-section">
        <label>Size Options *</label>
        <div className="size-options-container">
          {sizeOptions.map((sizeOption, index) => (
            <div key={sizeOption.id} className="size-option-item">
              <div className="size-option-header">
                <h4>Size Option {index + 1}</h4>
                <button 
                  type="button" 
                  className="remove-size-btn"
                  onClick={() => removeSizeOption(index)}
                  disabled={sizeOptions.length <= 1}
                >
                  Remove
                </button>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`size-name-${index}`}>Name *</label>
                  <input
                    type="text"
                    id={`size-name-${index}`}
                    value={sizeOption.name}
                    onChange={(e) => handleSizeOptionChange(index, 'name', e.target.value)}
                    placeholder="e.g., Small, Medium, Large"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`size-volume-${index}`}>Volume *</label>
                  <input
                    type="text"
                    id={`size-volume-${index}`}
                    value={sizeOption.volume}
                    onChange={(e) => handleSizeOptionChange(index, 'volume', e.target.value)}
                    placeholder="e.g., 5 Quart, 50 Quart"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`size-product-code-${index}`}>Product Code</label>
                  <input
                    type="text"
                    id={`size-product-code-${index}`}
                    value={sizeOption.productCode || ''}
                    onChange={(e) => handleSizeOptionChange(index, 'productCode', e.target.value)}
                    placeholder="Size-specific product code"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`size-price-${index}`}>Price ($) *</label>
                  <input
                    type="number"
                    id={`size-price-${index}`}
                    value={sizeOption.price}
                    onChange={(e) => handleSizeOptionChange(index, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`size-stock-${index}`}>Stock Quantity *</label>
                  <input
                    type="number"
                    id={`size-stock-${index}`}
                    value={sizeOption.stock}
                    onChange={(e) => handleSizeOptionChange(index, 'stock', e.target.value)}
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          type="button"
          className="add-size-btn"
          onClick={addSizeOption}
        >
          Add Size Option
        </button>
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="submit-btn"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : initialData ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;