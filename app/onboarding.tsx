import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';

export default function OnboardingScreen() {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!name.trim() || !mobile.trim() || !vehicleNumber.trim()) {
            Alert.alert('Error', 'Please fill in Name, Mobile, and Vehicle Number');
            return;
        }

        try {
            setLoading(true);
            const userId = `user_${mobile.replace(/\D/g, '')}`;

            // 1. Save User Profile
            const userData = {
                id: userId,
                name: name.trim(),
                mobile: mobile.trim(),
                created_at: new Date().toISOString()
            };

            await AsyncStorage.setItem('user_id', userId);
            await AsyncStorage.setItem('user_name', name.trim());
            await AsyncStorage.setItem('user_mobile', mobile.trim());

            // 2. Save User to Supabase
            const { error: userError } = await supabase
                .from('users')
                .upsert(userData);

            if (userError) console.error("User Save userError:", userError);

            // 3. Save Vehicle
            const normalizedPlate = vehicleNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            const vehicleData = {
                user_id: userId,
                vehicle_number: normalizedPlate,
                nickname: nickname.trim() || 'My Car',
                created_at: new Date().toISOString()
            };

            const { error: vehicleError } = await supabase
                .from('user_vehicles')
                .insert(vehicleData);

            if (vehicleError) {
                console.error("Vehicle Save Error:", vehicleError);
                Alert.alert("Warning", "Profile saved but vehicle sync failed. Please add vehicle in settings.");
            } else {
                Alert.alert('Success', 'Profile created! Happy Parking.');
            }

            router.replace('/');

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, justifyContent: 'center', minHeight: '100%' }}>
            <View style={{ marginBottom: 40 }}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's set up your profile & vehicle.</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94a3b8"
                />

                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Add Your Vehicle</Text>
                <Text style={styles.sectionSub}>You need at least one vehicle to start.</Text>

                <Text style={styles.label}>Vehicle Number (Plate)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="KL07..."
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    autoCapitalize="characters"
                    placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>Vehicle Nickname (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="My Car, Dad's Bike..."
                    value={nickname}
                    onChangeText={setNickname}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Start Parking</Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 18,
        color: '#64748b',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 16,
        marginBottom: 4
    },
    sectionSub: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16
    },
    form: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        color: '#0f172a'
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10
    },
    button: {
        backgroundColor: '#0f172a',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }]
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
