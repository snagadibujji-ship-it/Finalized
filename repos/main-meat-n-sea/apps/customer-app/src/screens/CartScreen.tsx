import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCartStore } from '../store/cartStore';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export default function CartScreen() {
  const { items, vendorId, getSubtotal, removeItem, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      // Get token (mocked for now, assumes user is logged in)
      const token = "mock_customer_token";

      // Format items for backend request
      const formattedItems = items.map(item => ({
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price
      }));

      // NOTE: We don't send calculated prices (subtotal/fees) because the Phase 2 backend
      // strictly recalculates everything in Integer Paise to prevent tampering!
      await axios.post(`${API_URL}/orders`, {
        vendorId,
        items: formattedItems,
        deliveryAddress: "123 Customer Home St",
        paymentMethod: "cod" // Defaulting to COD for Phase 4
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success!", "Your order has been placed successfully.");
      clearCart();
    } catch (error: any) {
      Alert.alert("Order Failed", error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price.toFixed(2)} x {item.qty}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.productId)} style={styles.removeBtn}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Subtotal:</Text>
          <Text style={styles.summaryPrice}>₹{getSubtotal().toFixed(2)}</Text>
        </View>
        <Text style={styles.feeNote}>+ ₹60 Delivery & 10% Platform fee calculated at checkout</Text>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>Place Order (COD)</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666' },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemPrice: { color: '#666', marginTop: 4 },
  removeBtn: { justifyContent: 'center' },
  removeText: { color: 'red', fontWeight: 'bold' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontSize: 16, fontWeight: 'bold' },
  summaryPrice: { fontSize: 18, fontWeight: 'bold' },
  feeNote: { fontSize: 12, color: '#888', marginBottom: 16 },
  checkoutBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
