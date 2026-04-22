import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ConfigScreen() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (!url.trim()) {
            Alert.alert('Error', 'Please enter a valid URL');
            return;
        }

        // Basic validation to ensure it starts with http/https
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://${formattedUrl}`;
        }
        // Remove trailing slash if present
        if (formattedUrl.endsWith('/')) {
            formattedUrl = formattedUrl.slice(0, -1);
        }

        try {
            setLoading(true);
            // Validate the URL by pinging the /status endpoint or similar if possible, 
            // but for now we just save it.
            await AsyncStorage.setItem('ngrok_url', formattedUrl);
            Alert.alert('Success', 'Configuration saved!');

            // Check if user is onboarded
            const user = await AsyncStorage.getItem('user_id');
            if (user) {
                router.replace('/');
            } else {
                router.replace('/onboarding');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Server Configuration</Text>
            <Text style={styles.subtitle}>Enter the Ngrok URL for the ANPR server</Text>

            <TextInput
                style={styles.input}
                placeholder="e.g. https://xxxx-xxxx.ngrok-free.app"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled
                ]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Save & Continue</Text>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#0f172a', // Slate 900
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#0f172a', // Slate 900
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
