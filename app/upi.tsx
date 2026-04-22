import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Modal,
  FlatList
} from "react-native";
import { supabase } from '../supabase';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  UserIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  PlayIcon
} from "react-native-heroicons/outline";

// Colors
const COLORS = {
  bg: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#0f172a",
  secondary: "#3b82f6",
  success: "#15803d",
  border: "#cbd5e1",
  warning: "#b45309",
  error: "#b91c1c",
  white: "#ffffff",
};

const PAYMENT_URL = "https://rzp.io/rzp/AHhfaHh";
const NGROK_URL_KEY = "ngrok_url";
const USER_ID_KEY = "user_id";

interface Vehicle {
  id: string;
  vehicle_number: string;
  nickname: string | null;
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  amount: number;
  vehicle_number: string;
}

export default function UpiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // State
  const [step, setStep] = useState<"idle" | "pending_entry" | "active" | "exit_detected" | "completed" | "processing">("idle");
  const [loading, setLoading] = useState(true);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [ngrokUrl, setNgrokUrl] = useState<string>("");

  // Session Data
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [parkingFee, setParkingFee] = useState(0);

  // Vehicles
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Polling
  const pollInterval = useRef<any>(null);

  const spot = params.spotId
    ? { id: params.spotId as string, name: params.spotName as string }
    : { id: "test_lot", name: "Test Parking Lot" };

  useEffect(() => {
    initialize();
    return () => stopPolling();
  }, []);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (step === 'active' && currentBooking) {
      timer = setInterval(() => {
        const start = new Date(currentBooking.start_time).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);

        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsed(
          `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, currentBooking]);

  const initialize = async () => {
    try {
      setLoading(true);
      const url = await AsyncStorage.getItem(NGROK_URL_KEY);
      if (!url) {
        Alert.alert("Configuration Error", "ANPR Server URL not set.");
        router.replace('/config');
        return;
      }
      setNgrokUrl(url);

      const uid = await AsyncStorage.getItem(USER_ID_KEY);
      if (uid) {
        await fetchUserVehicles(uid);
        await checkActiveSession(uid);
      } else {
        setLoading(false);
      }

    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchUserVehicles = async (uid: string) => {
    const { data } = await supabase
      .from('user_vehicles')
      .select('*')
      .eq('user_id', uid);

    if (data && data.length > 0) {
      setSavedVehicles(data);
      // Auto-select first vehicle if none selected
      if (!vehicleNumber) setVehicleNumber(data[0].vehicle_number);
    }
  };

  const checkActiveSession = async (uid: string) => {
    // Check if ANY of user's vehicles are active or in exit state
    // We can check by user_id matches in bookings?
    // Wait, bookings has user_id if we sent it.

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', uid)
      .in('status', ['pending_entry', 'active', 'exit_detected'])
      .order('start_time', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const booking = data[0];
      console.log("Restoring session:", booking);
      setCurrentBooking(booking);
      setVehicleNumber(booking.vehicle_number);

      if (booking.status === 'active') {
        setStep('active');
        startPolling(booking.id);
      } else if (booking.status === 'pending_entry') {
        setStep('pending_entry');
        startPolling(booking.id);
      } else if (booking.status === 'exit_detected') {
        setStep('exit_detected');
        setParkingFee(booking.amount || 0);
      }
    } else {
      setStep('idle');
    }
    setLoading(false);
  };

  const startParking = async () => {
    if (!vehicleNumber) return;

    try {
      setLoading(true);
      const uid = await AsyncStorage.getItem(USER_ID_KEY);

      // Call API
      const response = await fetch(`${ngrokUrl}/start_parking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          user_id: uid,
          lot_id: spot.id
        })
      });

      if (!response.ok) throw new Error("API Failed");

      const resData = await response.json();
      const booking = resData.booking;

      if (resData.message === "Vehicle already parked") {
        Alert.alert("Active/Pending Session Found", "This vehicle is already in a session. Resuming.");
      } else {
        // Normal flow
      }

      setCurrentBooking(booking);
      if (booking.status === 'active') {
        setStep('active');
      } else {
        setStep('pending_entry');
      }
      startPolling(booking.id);

    } catch (error) {
      Alert.alert("Error", "Could not start session. Check API.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (bookingId: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (data) {
        if (data.status === 'active') {
          setStep('active');
          setCurrentBooking(data); // Refresh to get start_time
        } else if (data.status === 'exit_detected') {
          stopPolling();
          setCurrentBooking(data);
          setParkingFee(data.amount);
          setStep('exit_detected');
        } else if (data.status === 'completed') {
          // Maybe paid elsewhere?
          stopPolling();
          setStep('completed');
        }
      }

      if (error) {
        console.log("Polling Error:", error);
      }
    }, 3000); // Check every 3s
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const handlePayment = async () => {
    try {
      setStep('processing');
      await WebBrowser.openBrowserAsync(PAYMENT_URL);

      // Mock Confirmation
      setTimeout(async () => {
        if (currentBooking) {
          // Update DB
          await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', currentBooking.id);

          setStep('completed');
        }
      }, 2000);
    } catch (error) {
      setStep('exit_detected');
      Alert.alert("Payment Failed");
    }
  };

  const resetFlow = () => {
    setStep('idle');
    setCurrentBooking(null);
    setElapsed("00:00:00");
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.h1}>ParkinToday</Text>
        <Text style={styles.subtitle}>{spot.name}</Text>
      </View>

      <Pressable onPress={async () => {
        await AsyncStorage.clear();
        router.replace('/config');
      }} style={styles.resetLink}>
        <ArrowPathIcon size={20} color={COLORS.warning} />
      </Pressable>

      {/* IDLE STATE */}
      {step === "idle" && (
        <View style={styles.content}>
          <Text style={styles.label}>Select Vehicle to Park</Text>

          <View style={styles.inputGroup}>
            <Pressable onPress={() => setShowVehicleModal(true)} style={styles.selectBtn}>
              <Text style={styles.selectText}>{vehicleNumber || "Select Vehicle"}</Text>
              <ChevronDownIcon size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <Pressable onPress={startParking} style={styles.btn}>
            <PlayIcon size={24} color={COLORS.white} />
            <Text style={styles.btnText}>Start Parking</Text>
          </Pressable>
        </View>
      )}

      {/* PENDING ENTRY STATE */}
      {step === "pending_entry" && (
        <View style={styles.card}>
          <View style={[styles.badgeEntry, { backgroundColor: COLORS.warning }]}>
            <Text style={styles.badgeText}>WAITING FOR ENTRY</Text>
          </View>
          <Text style={styles.plateLarge}>{currentBooking?.vehicle_number}</Text>
          <Text style={styles.description}>
            Please drive up to the camera. Timer will start automatically upon visuals.
          </Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        </View>
      )}

      {/* ACTIVE SESSION */}
      {step === "active" && (
        <View style={styles.card}>
          <View style={[styles.badgeEntry, { backgroundColor: COLORS.success }]}>
            <Text style={styles.badgeText}>ACTIVE SESSION</Text>
          </View>
          <Text style={styles.plateLarge}>{currentBooking?.vehicle_number}</Text>

          <View style={styles.timerContainer}>
            <ClockIcon size={24} color={COLORS.muted} />
            <Text style={styles.timerText}>{elapsed}</Text>
          </View>

          <Text style={styles.description}>
            Parking in progress. Billing will stop automatically upon exit.
          </Text>
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
        </View>
      )}

      {/* EXIT DETECTED / PAY */}
      {step === "exit_detected" && (
        <View style={styles.card}>
          <View style={styles.badgeExit}><Text style={styles.badgeText}>SESSION ENDED</Text></View>
          <Text style={styles.plateLarge}>{currentBooking?.vehicle_number}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time Parked</Text>
            <Text style={styles.infoValue}>
              {currentBooking?.end_time ?
                Math.round((new Date(currentBooking.end_time).getTime() - new Date(currentBooking.start_time).getTime()) / 60000)
                : 0} mins
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: 18, color: COLORS.text }]}>Total Fee</Text>
            <Text style={styles.feeValue}>₹{parkingFee}</Text>
          </View>
          <Text style={styles.feeSub}>@ ₹0.667 / min</Text>

          <Pressable onPress={handlePayment} style={styles.btn}>
            <Text style={styles.btnText}>Pay & Exit</Text>
          </Pressable>
        </View>
      )}

      {/* PROCESSING */}
      {step === "processing" && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.h2}>Processing Payment...</Text>
        </View>
      )}

      {/* COMPLETED SUCCESS */}
      {step === "completed" && (
        <View style={styles.successCard}>
          <CheckCircleIcon size={80} color={COLORS.success} />
          <Text style={styles.h2}>Gate Open!</Text>
          <Text style={styles.description}>Happy Parking</Text>
          <Pressable onPress={resetFlow} style={[styles.btnSecondary, { marginTop: 20 }]}>
            <Text style={styles.btnSecondaryText}>Close</Text>
          </Pressable>
        </View>
      )}

      {/* VEHICLE MODAL */}
      <Modal visible={showVehicleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.h2}>Select Vehicle</Text>
              <Pressable onPress={() => setShowVehicleModal(false)}>
                <XMarkIcon size={24} color={COLORS.muted} />
              </Pressable>
            </View>
            <FlatList
              data={savedVehicles}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.vehicleItem} onPress={() => {
                  setVehicleNumber(item.vehicle_number);
                  setShowVehicleModal(false);
                }}>
                  <UserIcon size={20} color={COLORS.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.vehiclePlate}>{item.vehicle_number}</Text>
                    {item.nickname && <Text style={styles.vehicleNick}>{item.nickname}</Text>}
                  </View>
                </Pressable>
              )}
            />

            {/* Option to Add New? Or direct to Profile */}
            <Pressable onPress={() => { setShowVehicleModal(false); router.push('/profile'); }} style={{ marginTop: 16 }}>
              <Text style={{ color: COLORS.secondary, textAlign: 'center', fontWeight: '600' }}>+ Add New Vehicle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 32, marginTop: 10 },
  h1: { fontSize: 32, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: COLORS.muted, fontWeight: '500' },

  content: { gap: 16 },

  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputGroup: { position: 'relative' },
  selectBtn: {
    borderWidth: 2, borderColor: COLORS.border, borderRadius: 16, padding: 18,
    backgroundColor: COLORS.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  selectText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },

  btn: {
    backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', width: '100%',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    flexDirection: 'row', justifyContent: 'center', gap: 8
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 18 },

  btnSecondary: { padding: 16, alignItems: 'center', marginTop: 8 },
  btnSecondaryText: { color: COLORS.muted, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.white, padding: 24, borderRadius: 24, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  successCard: {
    backgroundColor: '#f0fdf4', padding: 40, borderRadius: 24, alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.success
  },

  h2: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: COLORS.text, textAlign: 'center' },
  description: { textAlign: 'center', color: COLORS.muted, fontSize: 16, lineHeight: 24, marginTop: 10 },
  muted: { color: COLORS.muted, marginTop: 12, fontWeight: '500' },

  resetLink: { position: 'absolute', top: 24, right: 24, padding: 8, zIndex: 10 },

  plateLarge: { fontSize: 36, fontWeight: '900', color: COLORS.text, marginVertical: 16, letterSpacing: 1 },
  badgeEntry: { backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  badgeExit: { backgroundColor: COLORS.warning, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  badgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginVertical: 4 },
  infoLabel: { fontSize: 16, color: COLORS.muted, fontWeight: '500' },
  infoValue: { fontSize: 18, color: COLORS.text, fontWeight: '600' },
  feeValue: { fontSize: 32, color: COLORS.primary, fontWeight: '800' },
  feeSub: { fontSize: 14, color: COLORS.muted, marginBottom: 24 },
  divider: { height: 1, backgroundColor: COLORS.border, width: '100%', marginVertical: 12 },

  timerContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20
  },
  timerText: { fontSize: 32, fontWeight: '600', color: COLORS.text, fontVariant: ['tabular-nums'] },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  vehicleItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  vehiclePlate: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  vehicleNick: { fontSize: 14, color: COLORS.muted }
});