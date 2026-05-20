import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

// Replace with production URL later
const API_URL = 'http://localhost:4000/api';

export default function HomeScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        // Fetch nearby vendors
        // Note: For now, the backend route '/api/vendors/nearby' just returns approved vendors.
        // Once GeoJSON is fully implemented querying, it will filter by loc.coords.
        const res = await axios.get(`${API_URL}/vendors/nearby`);
        setVendors(res.data.vendors);
      } catch (err) {
        setErrorMsg('Failed to fetch vendors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Finding nearby stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Stores</Text>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      {vendors.length === 0 && !errorMsg ? (
        <Text style={styles.noVendors}>No vendors found nearby.</Text>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => {}}>
              <Text style={styles.shopName}>{item.shopName}</Text>
              <Text style={styles.address}>{item.address}</Text>
              <Text style={styles.distance}>Distance: ~2km</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  loadingText: { marginTop: 10, color: '#666' },
  error: { color: 'red', marginBottom: 10 },
  noVendors: { color: '#666', textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  shopName: { fontSize: 18, fontWeight: 'bold' },
  address: { color: '#666', marginTop: 4 },
  distance: { color: 'green', marginTop: 8, fontWeight: '500' }
});
