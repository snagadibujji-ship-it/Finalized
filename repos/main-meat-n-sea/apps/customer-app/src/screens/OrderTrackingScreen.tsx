import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import io, { Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:4000';

export default function OrderTrackingScreen({ route }: any) {
  // In a real navigation stack, orderId comes from route params
  const orderId = route?.params?.orderId || "demo-order-123";
  const CUSTOMER_TOKEN = "mock_customer_jwt_token"; // Mocked for phase 6

  const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket Server
    socketRef.current = io(BACKEND_URL, {
      auth: { token: CUSTOMER_TOKEN }
    });

    socketRef.current.on('connect', () => {
      console.log('Customer tracking socket connected');
      // Request to join the specific order tracking room
      socketRef.current?.emit('customer:join_order', { orderId });
    });

    // Listen for live rider coordinates
    socketRef.current.on('order:rider_location', (data) => {
      console.log('Live location ping:', data);
      setRiderLocation({ lat: data.lat, lng: data.lng });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  return (
    <View style={styles.container}>
      {riderLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: riderLocation.lat,
            longitude: riderLocation.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          mapType="none" // Important: disable default Google Maps tiles
        >
          {/* CRITICAL: Use OpenStreetMap free tiles instead of Google Maps API */}
          <UrlTile
            urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          <Marker
            coordinate={{ latitude: riderLocation.lat, longitude: riderLocation.lng }}
            title="Rider"
            description="Your delivery partner is on the way!"
          />
        </MapView>
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loaderText}>Waiting for rider GPS signal...</Text>
        </View>
      )}

      <View style={styles.overlayPanel}>
        <Text style={styles.statusText}>Order ID: {orderId}</Text>
        <Text style={styles.statusSubtext}>
          {riderLocation ? "Rider is en route" : "Awaiting location data"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
  },
  overlayPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 5,
    fontWeight: '500'
  }
});
