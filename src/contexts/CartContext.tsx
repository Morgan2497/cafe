import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

// Get or create guest session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};

interface CartItem {
  id: string
  name: string
  productNumber: string
  sizeId: string
  sizeName: string
  price: number
  quantity: number
  imageUrl: string
}

interface CartContextType {
  cart: CartItem[]
  savedItems: CartItem[]
  addToCart: (item: CartItem) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  saveForLater: (itemId: string) => Promise<void>
  moveToCart: (itemId: string) => Promise<void>
  removeSavedItem: (itemId: string) => Promise<void>
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [savedItems, setSavedItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser } = useAuth()

  // Derive user ID more safely
  const getUserId = () => {
    if (currentUser && currentUser.id) {
      return currentUser.id;
    }
    return getSessionId();
  };

  // Effect to load cart data when user changes
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true)
      
      try {
        const userId = getUserId();
        const isAuthenticated = currentUser !== null;

        if (isAuthenticated) {
          // Fetch from Firestore for logged in users
          console.log("Loading cart for authenticated user with ID:", userId);
          const cartDoc = await getDoc(doc(db, 'shoppingCarts', userId))
          const savedDoc = await getDoc(doc(db, 'savedItems', userId))
          
          if (cartDoc.exists()) {
            console.log("Cart document exists, items:", cartDoc.data().items || []);
            setCart(cartDoc.data().items || [])
          } else {
            console.log("No cart document found for this user");
            setCart([])
          }
          
          if (savedDoc.exists()) {
            setSavedItems(savedDoc.data().items || [])
          } else {
            setSavedItems([])
          }

          // If user just logged in, check for guest cart and merge
          const guestId = localStorage.getItem('guest_session_id')
          if (guestId) {
            const guestCartItems = JSON.parse(localStorage.getItem('guest_cart') || '[]')
            const guestSavedItems = JSON.parse(localStorage.getItem('guest_savedItems') || '[]')
            
            if (guestCartItems.length > 0 || guestSavedItems.length > 0) {
              await migrateGuestCart(guestCartItems, guestSavedItems)
            }
          }
          
        } else {
          // Load from localStorage for guest users
          console.log("Loading cart for guest user with session ID:", userId);
          const guestCartItems = JSON.parse(localStorage.getItem('guest_cart') || '[]')
          const guestSavedItems = JSON.parse(localStorage.getItem('guest_savedItems') || '[]')
          
          setCart(guestCartItems)
          setSavedItems(guestSavedItems)
        }
      } catch (err) {
        console.error('Error loading cart:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCart()
  }, [currentUser])

  // Helper function to migrate guest cart to user cart
  const migrateGuestCart = async (guestCartItems: CartItem[], guestSavedItems: CartItem[]) => {
    if (!currentUser || !currentUser.id) return
    
    const userId = currentUser.id
    const now = Timestamp.now()
    
    try {
      // Merge cart items
      if (guestCartItems.length > 0) {
        const cartRef = doc(db, 'shoppingCarts', userId)
        const cartSnap = await getDoc(cartRef)
        
        const existingItems = cartSnap.exists() ? cartSnap.data().items || [] : []
        const mergedItems = [...existingItems]
        
        // Add items not already in cart
        guestCartItems.forEach(guestItem => {
          const existingItemIndex = existingItems.findIndex((item: CartItem) => item.id === guestItem.id)
          
          if (existingItemIndex >= 0) {
            // Update quantity if item already exists
            mergedItems[existingItemIndex].quantity += guestItem.quantity
          } else {
            // Add new item
            mergedItems.push(guestItem)
          }
        })
        
        // Update Firestore and state
        await setDoc(cartRef, {
          userId,
          items: mergedItems,
          updatedAt: now,
          createdAt: cartSnap.exists() ? cartSnap.data().createdAt : now,
        })
        
        setCart(mergedItems)
      }
      
      // Merge saved items
      if (guestSavedItems.length > 0) {
        const savedRef = doc(db, 'savedItems', userId)
        const savedSnap = await getDoc(savedRef)
        
        const existingSavedItems = savedSnap.exists() ? savedSnap.data().items || [] : []
        const mergedSavedItems = [...existingSavedItems]
        
        // Add saved items not already saved
        guestSavedItems.forEach(guestItem => {
          const existingItemIndex = existingSavedItems.findIndex((item: CartItem) => item.id === guestItem.id)
          
          if (existingItemIndex === -1) {
            // Only add if not already saved
            mergedSavedItems.push(guestItem)
          }
        })
        
        // Update Firestore and state
        await setDoc(savedRef, {
          userId,
          items: mergedSavedItems,
          updatedAt: now,
          createdAt: savedSnap.exists() ? savedSnap.data().createdAt : now,
        })
        
        setSavedItems(mergedSavedItems)
      }
      
      // Clear guest cart data
      localStorage.removeItem('guest_cart')
      localStorage.removeItem('guest_savedItems')
      
    } catch (error) {
      console.error('Error migrating guest cart:', error)
    }
  }

  // Add item to cart
  const addToCart = async (item: CartItem) => {
    try {
      const now = Timestamp.now()
      const userId = getUserId();
      const isAuthenticated = currentUser !== null;
      
      console.log("Adding to cart for", isAuthenticated ? "authenticated user" : "guest", "with ID:", userId);

      if (isAuthenticated && userId) {
        // For logged in users, update Firestore
        const cartRef = doc(db, 'shoppingCarts', userId)
        const cartSnap = await getDoc(cartRef)
        
        if (cartSnap.exists()) {
          console.log("Existing cart found, updating with new item");
          const existingItems = cartSnap.data().items || []
          const itemIndex = existingItems.findIndex((i: CartItem) => i.id === item.id)
          
          let updatedItems;
          if (itemIndex >= 0) {
            // Update quantity if item exists
            updatedItems = existingItems.map((i: CartItem, idx: number) => {
              if (idx === itemIndex) {
                return { ...i, quantity: i.quantity + item.quantity };
              }
              return i;
            });
          } else {
            // Add new item
            updatedItems = [...existingItems, item];
          }
          
          await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: now
          })
          
          console.log("Cart updated in Firestore:", updatedItems);
          setCart(updatedItems)
        } else {
          console.log("No existing cart, creating new cart document");
          // Create new cart if it doesn't exist
          await setDoc(cartRef, {
            userId,
            items: [item],
            createdAt: now,
            updatedAt: now,
          })
          
          console.log("New cart created in Firestore with item:", item);
          setCart([item])
        }
      } else {
        // For guest users, update localStorage
        const existingItems = JSON.parse(localStorage.getItem('guest_cart') || '[]')
        const itemIndex = existingItems.findIndex((i: CartItem) => i.id === item.id)
        
        if (itemIndex >= 0) {
          existingItems[itemIndex].quantity += item.quantity
        } else {
          existingItems.push(item)
        }
        
        localStorage.setItem('guest_cart', JSON.stringify(existingItems))
        console.log("Guest cart updated in localStorage:", existingItems);
        setCart(existingItems)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error; // Re-throw to allow handling in the UI
    }
  }

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      if (currentUser) {
        // For logged in users
        const cartRef = doc(db, 'shoppingCarts', getUserId())
        const cartSnap = await getDoc(cartRef)
        
        if (cartSnap.exists()) {
          const existingItems = cartSnap.data().items || []
          const updatedItems = existingItems.filter((item: CartItem) => item.id !== itemId)
          
          await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: Timestamp.now()
          })
          
          setCart(updatedItems)
        }
      } else {
        // For guest users
        const existingItems = JSON.parse(localStorage.getItem('guest_cart') || '[]')
        const updatedItems = existingItems.filter((item: CartItem) => item.id !== itemId)
        
        localStorage.setItem('guest_cart', JSON.stringify(updatedItems))
        setCart(updatedItems)
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  // Update item quantity in cart
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    
    try {
      if (currentUser) {
        // For logged in users
        const cartRef = doc(db, 'shoppingCarts', getUserId())
        const cartSnap = await getDoc(cartRef)
        
        if (cartSnap.exists()) {
          const existingItems = cartSnap.data().items || []
          const updatedItems = existingItems.map((item: CartItem) => 
            item.id === itemId ? { ...item, quantity } : item
          )
          
          await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: Timestamp.now()
          })
          
          setCart(updatedItems)
        }
      } else {
        // For guest users
        const existingItems = JSON.parse(localStorage.getItem('guest_cart') || '[]')
        const updatedItems = existingItems.map((item: CartItem) => 
          item.id === itemId ? { ...item, quantity } : item
        )
        
        localStorage.setItem('guest_cart', JSON.stringify(updatedItems))
        setCart(updatedItems)
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  // Clear the entire cart
  const clearCart = async () => {
    try {
      if (currentUser) {
        // For logged in users
        const cartRef = doc(db, 'shoppingCarts', getUserId())
        await updateDoc(cartRef, {
          items: [],
          updatedAt: Timestamp.now()
        })
      } else {
        // For guest users
        localStorage.setItem('guest_cart', JSON.stringify([]))
      }
      
      setCart([])
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  // Move item from cart to saved for later
  const saveForLater = async (itemId: string) => {
    try {
      // Find item in cart
      const itemToSave = cart.find(item => item.id === itemId)
      if (!itemToSave) return
      
      // Remove from cart first
      await removeFromCart(itemId)
      
      if (currentUser) {
        // For logged in users
        const savedRef = doc(db, 'savedItems', getUserId())
        const savedSnap = await getDoc(savedRef)
        
        if (savedSnap.exists()) {
          const existingSaved = savedSnap.data().items || []
          
          // Check if item is already in saved items
          const itemIndex = existingSaved.findIndex((i: CartItem) => i.id === itemId)
          
          if (itemIndex === -1) {
            // Only add if not already saved
            existingSaved.push(itemToSave)
            
            await updateDoc(savedRef, {
              items: existingSaved,
              updatedAt: Timestamp.now()
            })
            
            setSavedItems(existingSaved)
          }
        } else {
          // Create saved items doc if it doesn't exist
          const now = Timestamp.now()
          await setDoc(savedRef, {
            userId: getUserId(),
            items: [itemToSave],
            createdAt: now,
            updatedAt: now,
          })
          
          setSavedItems([itemToSave])
        }
      } else {
        // For guest users
        const existingSaved = JSON.parse(localStorage.getItem('guest_savedItems') || '[]')
        
        // Check if item is already in saved items
        const itemIndex = existingSaved.findIndex((i: CartItem) => i.id === itemId)
        
        if (itemIndex === -1) {
          existingSaved.push(itemToSave)
          localStorage.setItem('guest_savedItems', JSON.stringify(existingSaved))
          setSavedItems(existingSaved)
        }
      }
    } catch (error) {
      console.error('Error saving for later:', error)
    }
  }

  // Move item from saved items to cart
  const moveToCart = async (itemId: string) => {
    try {
      // Find item in saved items
      const itemToMove = savedItems.find(item => item.id === itemId)
      if (!itemToMove) return
      
      // First, add to cart
      await addToCart({ ...itemToMove, quantity: 1 })
      
      // Then, remove from saved items
      await removeSavedItem(itemId)
    } catch (error) {
      console.error('Error moving to cart:', error)
    }
  }

  // Remove item from saved items
  const removeSavedItem = async (itemId: string) => {
    try {
      if (currentUser) {
        // For logged in users
        const savedRef = doc(db, 'savedItems', getUserId())
        const savedSnap = await getDoc(savedRef)
        
        if (savedSnap.exists()) {
          const existingSaved = savedSnap.data().items || []
          const updatedSaved = existingSaved.filter((item: CartItem) => item.id !== itemId)
          
          await updateDoc(savedRef, {
            items: updatedSaved,
            updatedAt: Timestamp.now()
          })
          
          setSavedItems(updatedSaved)
        }
      } else {
        // For guest users
        const existingSaved = JSON.parse(localStorage.getItem('guest_savedItems') || '[]')
        const updatedSaved = existingSaved.filter((item: CartItem) => item.id !== itemId)
        
        localStorage.setItem('guest_savedItems', JSON.stringify(updatedSaved))
        setSavedItems(updatedSaved)
      }
    } catch (error) {
      console.error('Error removing saved item:', error)
    }
  }

  return (
    <CartContext.Provider value={{ 
      cart, 
      savedItems,
      addToCart, 
      removeFromCart,
      updateQuantity,
      clearCart,
      saveForLater,
      moveToCart,
      removeSavedItem,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
