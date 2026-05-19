import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ActiveBatchScreen({ route }: any) {
  // In real app, pass the accepted batch data via route params
  const batch = route?.params?.batch || {
    vendorName: "Demo Vendor",
    totalDropoffs: 2,
    orders: [
      { orderId: "123", deliveryAddress: "45 Customer St" },
      { orderId: "124", deliveryAddress: "99 Another Ave" }
    ]
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Active Route</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step 0: Vendor Pickup */}
        <View style={styles.stepCard}>
          <View style={styles.stepIndicator}>
            <View style={[styles.dot, styles.pickupDot]} />
            <View style={styles.line} />
          </View>
          <View style={styles.stepDetails}>
            <Text style={styles.stepTitle}>Step 1: Pickup</Text>
            <Text style={styles.stepAddress}>{batch.vendorName}</Text>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>Navigate to Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Drop-off Steps */}
        {batch.orders.map((order: any, idx: number) => (
          <View key={order.orderId} style={styles.stepCard}>
            <View style={styles.stepIndicator}>
              <View style={[styles.dot, styles.dropoffDot]} />
              {idx < batch.orders.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.stepDetails}>
              <Text style={styles.stepTitle}>Step {idx + 2}: Drop-off</Text>
              <Text style={styles.stepAddress}>{order.deliveryAddress?.address || order.deliveryAddress}</Text>
              <Text style={styles.orderIdText}>Order ID: {order.orderId.substring(order.orderId.length - 6)}</Text>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionText}>Navigate to Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 20, backgroundColor: '#fff', paddingTop: 60, borderBottomWidth: 1, borderColor: '#eee' },
  scrollContent: { padding: 20 },
  stepCard: { flexDirection: 'row', marginBottom: 0 },
  stepIndicator: { width: 30, alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, zIndex: 2 },
  pickupDot: { backgroundColor: '#007AFF' },
  dropoffDot: { backgroundColor: '#34C759' },
  line: { width: 2, flex: 1, backgroundColor: '#ccc', marginVertical: -4 },
  stepDetails: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, marginLeft: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  stepAddress: { fontSize: 18, marginTop: 5, color: '#000' },
  orderIdText: { fontSize: 12, color: '#888', marginTop: 5 },
  actionBtn: { marginTop: 15, backgroundColor: '#f0f0f5', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#007AFF', fontWeight: 'bold' }
});
