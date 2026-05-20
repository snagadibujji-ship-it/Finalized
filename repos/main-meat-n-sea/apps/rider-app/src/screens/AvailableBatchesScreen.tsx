import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000';
const RIDER_TOKEN = "mock_rider_jwt_token";

export default function AvailableBatchesScreen() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableBatches();
    const interval = setInterval(fetchAvailableBatches, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableBatches = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/riders/me/jobs`, {
        headers: { Authorization: `Bearer ${RIDER_TOKEN}` }
      });
      setBatches(res.data.jobs);
    } catch (error) {
      console.error("Failed fetching jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptBatch = async (batch: any) => {
    try {
      const orderIds = batch.orders.map((o: any) => o.orderId);
      const res = await axios.put(`${BACKEND_URL}/api/riders/jobs/batch/accept`,
        { orderIds },
        { headers: { Authorization: `Bearer ${RIDER_TOKEN}` } }
      );

      if (res.data.success) {
        Alert.alert("Batch Accepted!", `Assigned ${res.data.assignedOrdersCount} orders.\n\nNavigate to Vendor: ${batch.vendorName}`);
        fetchAvailableBatches();
        // In full app, navigate to ActiveBatchScreen here
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
         Alert.alert("Missed it!", "Another rider accepted this batch.");
      } else {
         Alert.alert("Error", "Failed to accept batch.");
      }
      fetchAvailableBatches();
    }
  };

  if (loading && batches.length === 0) {
    return <View style={styles.center}><Text>Loading Available Batches...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Pickups Near You</Text>

      {batches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No available batches right now.</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item: any) => item.vendorId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.vendorName}>{item.vendorName}</Text>
                <Text style={styles.earnings}>₹{(item.totalBatchEarningsPaise / 100).toFixed(2)}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.dropoffCount}>1 Pickup → {item.totalDropoffs} Drop-offs</Text>
                <Text style={styles.subtext}>Orders included: {item.orders.length}</Text>
              </View>

              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptBatch(item)}>
                <Text style={styles.acceptText}>Accept Batch</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vendorName: { fontSize: 18, fontWeight: 'bold' },
  earnings: { fontSize: 18, fontWeight: 'bold', color: '#34C759' },
  cardBody: { marginBottom: 15 },
  dropoffCount: { fontSize: 16, color: '#333', fontWeight: '500' },
  subtext: { color: '#666', marginTop: 4 },
  acceptBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
