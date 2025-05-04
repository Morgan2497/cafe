import React, { createContext, useContext, useState, ReactNode } from 'react';

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];  // Ensure 'cart' is defined here as an array of CartItem objects
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => [...prevCart, item]);
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== itemId));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
