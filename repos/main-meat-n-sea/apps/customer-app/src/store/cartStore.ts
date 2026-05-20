import { create } from 'zustand';
import { Alert } from 'react-native';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  vendorId: string | null;
  items: CartItem[];
  addItem: (vendorId: string, item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  vendorId: null,
  items: [],

  addItem: (vendorId: string, item: CartItem) => {
    const { vendorId: currentVendorId, items, clearCart } = get();

    // CRITICAL RULE: Enforce One Vendor Per Cart
    if (currentVendorId && currentVendorId !== vendorId) {
      Alert.alert(
        "Different Store",
        "Your cart contains items from another shop. Clear cart and add this item?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear & Add",
            style: "destructive",
            onPress: () => {
              clearCart();
              set({ vendorId, items: [item] });
            }
          }
        ]
      );
      return; // Do not add item until user confirms via Alert callback
    }

    // Add to cart normally
    const existingItem = items.find(i => i.productId === item.productId);

    if (existingItem) {
      set({
        items: items.map(i =>
          i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i
        )
      });
    } else {
      set({ vendorId, items: [...items, item] });
    }
  },

  removeItem: (productId: string) => {
    set((state) => {
      const newItems = state.items.filter(i => i.productId !== productId);
      return {
        items: newItems,
        vendorId: newItems.length === 0 ? null : state.vendorId
      };
    });
  },

  clearCart: () => {
    set({ vendorId: null, items: [] });
  },

  getSubtotal: () => {
    const { items } = get();
    // Subtotal in Rupees (Frontend display representation)
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  }
}));
