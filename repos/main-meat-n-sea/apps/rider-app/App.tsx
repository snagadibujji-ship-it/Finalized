import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import io, { Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:4000';

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [incomingJob, setIncomingJob] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Hardcoded for Phase 5 demo. In production, get from SecureStore or Auth Context.
  const RIDER_TOKEN = "mock_rider_jwt_token";

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    return () => {
      stopTrackingAndDisconnect();
    };
  }, []);

  const handleToggle = async (val: boolean) => {
    if (val && !hasPermission) {
      Alert.alert('Permission Denied', 'Please enable location services to go online.');
      return;
    }

    setIsOnline(val);

    if (val) {
      connectSocketAndTrack();
    } else {
      stopTrackingAndDisconnect();
    }
  };

  const connectSocketAndTrack = async () => {
    try {
      // 1. Connect Socket
      socketRef.current = io(BACKEND_URL, {
        auth: { token: RIDER_TOKEN }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to backend WebSocket as Rider!');
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setIsOnline(false);
        Alert.alert('Connection Error', err.message);
      });

      // 2. Listen for Incoming Jobs
      socketRef.current.on('rider:new_job', (jobPayload) => {
        console.log('Incoming Job Received:', jobPayload);
        setIncomingJob(jobPayload);
      });

      // 3. Start GPS Tracking (every 5 seconds)
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          console.log(`Sending Location: ${location.coords.latitude}, ${location.coords.longitude}`);
          if (socketRef.current?.connected) {
            socketRef.current.emit('rider:location_update', {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
        }
      );
    } catch (error) {
      console.error('Tracking setup failed:', error);
      setIsOnline(false);
    }
  };

  const stopTrackingAndDisconnect = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIncomingJob(null);
  };

  const acceptJob = () => {
    // Logic to accept the job via API
    Alert.alert("Job Accepted!", "Navigate to the vendor.");
    setIncomingJob(null);
  };

  const rejectJob = () => {
    setIncomingJob(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rider Dashboard</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
          {isOnline ? "You are ONLINE" : "You are OFFLINE"}
        </Text>
        <Text style={styles.subText}>
          {isOnline ? "Broadcasting location and waiting for jobs..." : "Go online to start receiving delivery requests."}
        </Text>

        <Switch
          trackColor={{ false: '#767577', true: '#34C759' }}
          thumbColor={isOnline ? '#fff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={handleToggle}
          value={isOnline}
          style={styles.toggle}
        />

        {isOnline && <ActivityIndicator size="large" color="#34C759" style={{ marginTop: 40 }} />}
      </View>

      {/* Incoming Job Modal */}
      <Modal visible={!!incomingJob} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.jobCard}>
            <Text style={styles.newJobTitle}>NEW DELIVERY REQUEST!</Text>

            {incomingJob && (
              <View style={styles.jobDetails}>
                <Text style={styles.detailText}>From: {incomingJob.pickupAddress}</Text>
                <Text style={styles.detailText}>To: {incomingJob.dropoffAddress}</Text>
                <Text style={styles.detailText}>Distance: {incomingJob.distance} km</Text>
                <Text style={styles.earningsText}>Est. Earnings: ₹{incomingJob.earnings}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={rejectJob}>
                <Text style={styles.btnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={acceptJob}>
                <Text style={styles.btnText}>ACCEPT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: { padding: 20, backgroundColor: '#fff', paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold' },
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  statusText: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  onlineText: { color: '#34C759' },
  offlineText: { color: '#888' },
  subText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  toggle: { transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }] },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  jobCard: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  newJobTitle: { fontSize: 20, fontWeight: '900', color: '#007AFF', textAlign: 'center', marginBottom: 20 },
  jobDetails: { marginBottom: 30, gap: 10 },
  detailText: { fontSize: 16, color: '#333' },
  earningsText: { fontSize: 20, fontWeight: 'bold', color: '#34C759', marginTop: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#FF3B30' },
  acceptBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
