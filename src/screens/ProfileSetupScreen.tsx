import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { theme } from '../theme';
import { Logo, MedicalCard } from '../components';

export default function ProfileSetupScreen({ onComplete }: { onComplete: () => void }) {
    const { state, signOut } = useContext(AuthContext);
    const [diagnosis, setDiagnosis] = useState('');
    const [fullName, setFullName] = useState('');
    const [meds, setMeds] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!diagnosis) {
            Alert.alert('Diagnóstico Requerido', 'Por favor ingrese su diagnóstico principal para calibrar los algoritmos de riesgo.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/clinical/profile', {
                userId: state.userId,
                diagnosis,
                fullName,
                riskLevel: 'LOW',
                medications: meds ? meds.split(',').map(m => m.trim()) : [],
                emergencyContacts: []
            });
            onComplete();
        } catch (error) {
            console.error('[ProfileSetup] Error:', error);
            Alert.alert('Error del Sistema', 'No se pudo inicializar el expediente clínico.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Logo size="md" showClaim={false} />
                    <Text style={styles.title}>CONFIGURACIÓN CLÍNICA</Text>
                    <Text style={styles.subtitle}>Inicialice su expediente para activar el monitoreo proactivo.</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.sectionLabel}>DATOS DE DIAGNÓSTICO</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>IDENTIDAD (NOMBRE Y APELLIDO)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Juan Talmasky"
                            placeholderTextColor={theme.colors.textMuted}
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DIAGNÓSTICO BASE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Migraña Crónica con Aura"
                            placeholderTextColor={theme.colors.textMuted}
                            value={diagnosis}
                            onChangeText={setDiagnosis}
                            autoCapitalize="sentences"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>MEDICACIÓN ACTUAL (OPCIONAL)</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Ej: Sumatriptán, Propranolol (separados por coma)"
                            placeholderTextColor={theme.colors.textMuted}
                            value={meds}
                            onChangeText={setMeds}
                            multiline
                        />
                    </View>

                    <MedicalCard style={styles.infoNote}>
                        <Text style={styles.infoText}>
                            Podrá configurar sus contactos de emergencia y alertas SOS una vez dentro del sistema principal.
                        </Text>
                    </MedicalCard>

                    <TouchableOpacity
                        style={[styles.button, loading && { opacity: 0.8 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>ACTIVAR MONITORIZACIÓN</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={signOut}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.signOutText}>SALIR DE LA SESIÓN</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionLabel}>EPIMIGRAPP V.2.1-STAFF</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 32, paddingVertical: 40, flexGrow: 1 },

    header: { alignItems: 'center', marginBottom: 48 },
    title: { fontSize: 13, fontWeight: '900', color: theme.colors.navy, letterSpacing: 2, marginTop: 24, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

    form: { gap: 24 },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
    inputGroup: { gap: 8 },
    label: { fontSize: 10, fontWeight: '700', color: theme.colors.navy, letterSpacing: 0.5 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
        color: theme.colors.navy,
        fontSize: 15,
        fontWeight: '600',
    },
    infoNote: { padding: 16, backgroundColor: 'rgba(79, 70, 229, 0.03)', borderWidth: 0 },
    infoText: { color: theme.colors.primary, fontSize: 12, lineHeight: 18, textAlign: 'center', fontWeight: '500' },

    button: {
        backgroundColor: theme.colors.navy,
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    signOutButton: {
        marginTop: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    signOutText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 1,
        textDecorationLine: 'underline',
    },
    versionLabel: { textAlign: 'center', fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginTop: 40 },
});
