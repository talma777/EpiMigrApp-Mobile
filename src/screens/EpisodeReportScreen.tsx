import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { theme } from '../theme';
import { MedicalCard, Logo } from '../components';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const INTENSITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TRIGGER_OPTIONS = ['Estrés', 'Luz Fuerte', 'Ruido', 'Falta de Sueño', 'Ayuno', 'Ejercicio', 'Clima'];

export default function EpisodeReportScreen({ navigation }: any) {
    const { state } = useContext(AuthContext);
    const [intensity, setIntensity] = useState<number | null>(null);
    const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [medTaken, setMedTaken] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggleTrigger = (t: string) => {
        if (selectedTriggers.includes(t)) {
            setSelectedTriggers(selectedTriggers.filter(item => item !== t));
        } else {
            setSelectedTriggers([...selectedTriggers, t]);
        }
    };

    const handleSave = async () => {
        if (intensity === null) {
            Alert.alert("Dato requerido", "Por favor seleccione el nivel de intensidad.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/episodes', {
                userId: state.userId,
                timestamp: new Date().toISOString(),
                intensity,
                triggers: selectedTriggers,
                notes,
                medicationTaken: medTaken,
            });

            Alert.alert("Registro Exitoso", "Episodio documentado. Su médico y la IA han sido notificados.");
            navigation.goBack();
        } catch (error) {
            console.error('[Report] Error:', error);
            Alert.alert("Error de Conexión", "No se pudo sincronizar el reporte. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>LOG DE CRISIS</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* NIVEL DE DOLOR */}
                <Text style={styles.sectionTitle}>1. INTENSIDAD DEL DOLOR</Text>
                <View style={styles.intensityGrid}>
                    {INTENSITIES.map(i => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.intensityDot,
                                intensity === i && styles.intensitySelected,
                                i > 7 && intensity === i && { backgroundColor: theme.colors.riskHigh }
                            ]}
                            onPress={() => setIntensity(i)}
                        >
                            <Text style={[styles.intensityText, intensity === i && { color: '#fff' }]}>{i}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* DETONANTES */}
                <Text style={styles.sectionTitle}>2. POSIBLES DETONANTES (OPCIONAL)</Text>
                <View style={styles.triggerRow}>
                    {TRIGGER_OPTIONS.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.triggerChip, selectedTriggers.includes(t) && styles.triggerSelected]}
                            onPress={() => toggleTrigger(t)}
                        >
                            <Text style={[styles.triggerText, selectedTriggers.includes(t) && { color: '#fff' }]}>
                                {t.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* MEDICACIÓN */}
                <Text style={styles.sectionTitle}>3. TRATAMIENTO DE RESCATE</Text>
                <TouchableOpacity
                    style={[styles.medCard, medTaken && styles.medCardActive]}
                    onPress={() => setMedTaken(!medTaken)}
                >
                    <View style={[styles.check, medTaken && styles.checkActive]} />
                    <Text style={styles.medLabel}>HE ADMINISTRADO MEDICACIÓN</Text>
                </TouchableOpacity>

                {/* NOTAS */}
                <Text style={styles.sectionTitle}>4. OBSERVACIONES ADICIONALES</Text>
                <TextInput
                    style={styles.notesInput}
                    placeholder="Ej: Dolor focalizado en el ojo izquierdo..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                />

                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>REGISTRAR EPISODIO</Text>}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Este reporte actualiza inmediatamente su nivel de riesgo clínico.
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    closeIcon: { fontSize: 20, color: theme.colors.textMuted },
    headerTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.navy, letterSpacing: 1.5 },

    scroll: { padding: 32, paddingBottom: 60 },
    sectionTitle: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginBottom: 16 },

    intensityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 40 },
    intensityDot: {
        width: 45, height: 45, borderRadius: 12, backgroundColor: '#FFFFFF',
        borderWidth: 1.5, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    intensitySelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    intensityText: { fontSize: 16, fontWeight: '800', color: theme.colors.navy },

    triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
    triggerChip: {
        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9',
    },
    triggerSelected: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
    triggerText: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted },

    medCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18,
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
        marginBottom: 40,
    },
    medCardActive: { borderColor: theme.colors.accent, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    check: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#E2E8F0' },
    checkActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    medLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.navy, letterSpacing: 0.5 },

    notesInput: {
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
        padding: 16, fontSize: 14, color: theme.colors.navy, textAlignVertical: 'top',
        marginBottom: 40, height: 100,
    },

    saveBtn: {
        backgroundColor: theme.colors.navy, borderRadius: 20, paddingVertical: 20,
        alignItems: 'center', shadowColor: theme.colors.navy, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
    disclaimer: { textAlign: 'center', fontSize: 10, color: theme.colors.textMuted, marginTop: 20, lineHeight: 16 },
});
