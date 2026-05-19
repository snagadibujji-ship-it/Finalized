import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string | null;
};

type CartState = {
  shopId: number | null;
  items: CartItem[];
};

type CartContextType = {
  cart: CartState;
  addItem: (item: CartItem & { shopId: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(() => {
    try {
      const saved = localStorage.getItem("localmart_cart");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { shopId: null, items: [] };
  });

  useEffect(() => {
    localStorage.setItem("localmart_cart", JSON.stringify(cart));
  }, [cart]);

  const addItem = (newItem: CartItem & { shopId: number }) => {
    setCart((current) => {
      if (current.shopId !== null && current.shopId !== newItem.shopId) {
        if (window.confirm("Adding items from a new shop will clear your current cart. Continue?")) {
          return {
            shopId: newItem.shopId,
            items: [{ productId: newItem.productId, name: newItem.name, price: newItem.price, quantity: newItem.quantity, imageUrl: newItem.imageUrl }]
          };
        }
        return current;
      }

      const existing = current.items.find(i => i.productId === newItem.productId);
      if (existing) {
        return {
          ...current,
          items: current.items.map(i => 
            i.productId === newItem.productId 
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          )
        };
      }

      return {
        shopId: newItem.shopId,
        items: [...current.items, { 
          productId: newItem.productId, 
          name: newItem.name, 
          price: newItem.price, 
          quantity: newItem.quantity,
          imageUrl: newItem.imageUrl
        }]
      };
    });
  };

  const removeItem = (productId: number) => {
    setCart(current => {
      const newItems = current.items.filter(i => i.productId !== productId);
      return {
        shopId: newItems.length === 0 ? null : current.shopId,
        items: newItems
      };
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setCart(current => ({
      ...current,
      items: current.items.map(i => i.productId === productId ? { ...i, quantity } : i)
    }));
  };

  const clearCart = () => {
    setCart({ shopId: null, items: [] });
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
