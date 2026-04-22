import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from 'react-native-heroicons/outline';

const COLORS = {
    bg: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#0f172a",
    danger: "#ef4444",
    border: "#cbd5e1",
    white: "#ffffff",
    success: "#15803d",
};

interface Vehicle {
    id: string;
    vehicle_number: string;
    nickname: string | null;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Add Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlate, setNewPlate] = useState("");
    const [newNick, setNewNick] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const id = await AsyncStorage.getItem('user_id');
            if (!id) {
                router.replace('/onboarding');
                return;
            }
            setUserId(id);
            fetchVehicles(id);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const fetchVehicles = async (uid: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_vehicles')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (error) {
                const msg = error.message || error.details || error.hint || 'unknown';
                const code = error.code || 'no-code';
                console.error(`[Supabase] fetchVehicles error | code=${code} | msg=${msg} | details=${error.details}`);
                Alert.alert('Load Error', `Code: ${code}\n${msg}`);
                return;
            }
            setVehicles(data || []);
        } catch (err: any) {
            console.error('[fetchVehicles] unexpected error:', err?.message || err);
        } finally {
            setLoading(false);
        }
    };

    const addVehicle = async () => {
        if (!newPlate.trim()) {
            Alert.alert("Required", "Please enter vehicle number");
            return;
        }

        try {
            setAdding(true);
            const normalized = newPlate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

            const { error } = await supabase
                .from('user_vehicles')
                .insert({
                    user_id: userId,
                    vehicle_number: normalized,
                    nickname: newNick.trim() || null
                });

            if (error) {
                console.error('[Supabase] addVehicle error:', JSON.stringify(error));
                Alert.alert('Add Error', `Could not add vehicle.\n\nCode: ${error.code}\n${error.message}`);
                return;
            }

            setNewPlate("");
            setNewNick("");
            setModalVisible(false);
            if (userId) fetchVehicles(userId);

        } catch (err: any) {
            console.error('[addVehicle] unexpected error:', err?.message || err);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setAdding(false);
        }
    };

    const deleteVehicle = async (id: string) => {
        try {
            const { error } = await supabase
                .from('user_vehicles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            if (userId) fetchVehicles(userId);
        } catch (error) {
            Alert.alert("Error", "Could not delete vehicle");
        }
    };

    const renderItem = ({ item }: { item: Vehicle }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.plate}>{item.vehicle_number}</Text>
                {item.nickname && <Text style={styles.nick}>{item.nickname}</Text>}
            </View>
            <Pressable onPress={() => deleteVehicle(item.id)} style={styles.deleteBtn}>
                <TrashIcon size={20} color={COLORS.danger} />
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeftIcon size={24} color={COLORS.primary} />
                </Pressable>
                <Text style={styles.h1}>My Vehicles</Text>
                <Pressable onPress={() => setModalVisible(true)} style={styles.addBtn}>
                    <PlusIcon size={24} color={COLORS.white} />
                </Pressable>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={vehicles}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No vehicles saved.</Text>
                            <Text style={styles.emptySub}>Add a vehicle for quick access.</Text>
                        </View>
                    }
                />
            )}

            {/* Add Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Vehicle</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <XMarkIcon size={24} color={COLORS.muted} />
                            </Pressable>
                        </View>

                        <Text style={styles.label}>Vehicle Number</Text>
                        <TextInput
                            style={styles.input}
                            value={newPlate}
                            onChangeText={setNewPlate}
                            placeholder="KL07..."
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Nickname (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={newNick}
                            onChangeText={setNewNick}
                            placeholder="My Car, Dad's Bike..."
                        />

                        <Pressable onPress={addVehicle} disabled={adding} style={styles.modalAddBtn}>
                            {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalAddText}>Save Vehicle</Text>}
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.border
    },
    h1: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
    backBtn: { padding: 8 },
    addBtn: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 8 },

    card: {
        backgroundColor: COLORS.white, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border
    },
    plate: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    nick: { fontSize: 14, color: COLORS.muted, marginTop: 2 },
    deleteBtn: { padding: 8 },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.muted },
    emptySub: { fontSize: 14, color: COLORS.muted, marginTop: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },

    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
    input: {
        borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16,
        backgroundColor: COLORS.bg, color: COLORS.text
    },
    modalAddBtn: {
        backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8
    },
    modalAddText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
