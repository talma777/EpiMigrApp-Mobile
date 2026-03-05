import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, SafeAreaView, Alert, StatusBar } from 'react-native';
import { theme } from '../theme';
import { MedicalCard, Logo } from '../components';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const INTENSITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TRIGGER_OPTIONS = ['Estrés', 'Luz Fuerte', 'Ruido', 'Falta de Sueño', 'Ayuno', 'Ejercicio', 'Clima'];
const EPISODE_TYPES = [
    { id: 'EPILEPSY', label: 'EPILEPSIA', color: '#E11D48', icon: '🧠' },
    { id: 'MIGRAINE', label: 'MIGRAÑA', color: '#4F46E5', icon: '⚡' },
    { id: 'AURA', label: 'AURA', color: '#8B5CF6', icon: '🌀' }
];

export default function EpisodeScreen({ navigation }: any) {
    const { state } = useContext(AuthContext);
    const [episodeType, setEpisodeType] = useState<string | null>(null);
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
        if (!episodeType) {
            Alert.alert("Categoría Requerida", "Por favor seleccione el tipo de evento.");
            return;
        }
        if (intensity === null) {
            Alert.alert("Dato requerido", "Por favor seleccione el nivel de intensidad.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/episodes', {
                userId: state.userId,
                type: episodeType,
                timestamp: new Date().toISOString(),
                intensity,
                triggers: selectedTriggers,
                notes,
                medicationTaken: medTaken,
            });

            Alert.alert(
                "Registro Exitoso",
                "Episodio documentado. El análisis de riesgo ha sido actualizado.",
                [{ text: "ENTENDIDO", onPress: () => navigation.navigate('Home') }]
            );
        } catch (error) {
            console.error('[EpisodeScreen] Error:', error);
            Alert.alert("Error de Conexión", "No se pudo sincronizar el reporte. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>REGISTRO DE EPISODIO</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* TIPO DE EPISODIO */}
                <Text style={styles.sectionTitle}>CATEGORÍA DEL EVENTO</Text>
                <View style={styles.typeContainer}>
                    {EPISODE_TYPES.map(t => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.typeCard,
                                episodeType === t.id && { borderColor: t.color, backgroundColor: t.color + '10' }
                            ]}
                            onPress={() => setEpisodeType(t.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.typeIcon}>{t.icon}</Text>
                            <Text style={[
                                styles.typeLabel,
                                episodeType === t.id && { color: t.color }
                            ]}>{t.label}</Text>
                            {episodeType === t.id && <View style={[styles.typeActiveDot, { backgroundColor: t.color }]} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* INTENSIDAD */}
                <Text style={styles.sectionTitle}>NIVEL DE SEVERIDAD (VAS)</Text>
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

                {/* DETONANTES TÉCNICOS */}
                <Text style={styles.sectionTitle}>FACTORES DESENCADENANTES</Text>
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

                {/* MEDICACIÓN ACCIÓN RÁPIDA */}
                <Text style={styles.sectionTitle}>INTERVENCIÓN FARMACOLÓGICA</Text>
                <TouchableOpacity
                    style={[styles.medCard, medTaken && styles.medCardActive]}
                    onPress={() => setMedTaken(!medTaken)}
                    activeOpacity={0.9}
                >
                    <View style={[styles.check, medTaken && styles.checkActive]} />
                    <View>
                        <Text style={styles.medLabel}>TRATAMIENTO DE RESCATE ADMINISTRADO</Text>
                        {medTaken && <Text style={styles.medSub}>Sincronizado con historial clínico</Text>}
                    </View>
                </TouchableOpacity>

                {/* CAMPOS DE NOTAS CLÍNICAS */}
                <Text style={styles.sectionTitle}>SINTOMATOLOGÍA Y NOTAS</Text>
                <TextInput
                    style={styles.notesInput}
                    placeholder="Describa síntomas (fotofobia, náuseas, etc.)..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>REGISTRAR EVENTO</Text>}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Este reporte es vinculante para su análisis proactivo de riesgo.
                    Consulte a emergencias si el dolor es inusualmente intenso.
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

    typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 32 },
    typeCard: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        borderWidth: 1.5, borderColor: '#F1F5F9', alignItems: 'center', position: 'relative'
    },
    typeIcon: { fontSize: 24, marginBottom: 8 },
    typeLabel: { fontSize: 9, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 0.5 },
    typeActiveDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },

    intensityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 40 },
    intensityDot: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF',
        borderWidth: 1.5, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    intensitySelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    intensityText: { fontSize: 16, fontWeight: '800', color: theme.colors.navy },

    triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
    triggerChip: {
        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F1F5F9',
    },
    triggerSelected: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
    triggerText: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted },

    medCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20,
        backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#F1F5F9',
        marginBottom: 40,
    },
    medCardActive: { borderColor: theme.colors.accent, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    check: { width: 22, height: 22, borderRadius: 8, borderWidth: 2, borderColor: '#E2E8F0' },
    checkActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    medLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.navy, letterSpacing: 0.5 },
    medSub: { fontSize: 9, color: theme.colors.accent, fontWeight: '700', marginTop: 2 },

    notesInput: {
        backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#F1F5F9',
        padding: 20, fontSize: 14, color: theme.colors.navy,
        marginBottom: 44, height: 120,
    },

    saveBtn: {
        backgroundColor: theme.colors.navy, borderRadius: 24, paddingVertical: 22,
        alignItems: 'center', shadowColor: theme.colors.navy, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25, shadowRadius: 15, elevation: 10,
    },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
    disclaimer: { textAlign: 'center', fontSize: 10, color: theme.colors.textMuted, marginTop: 24, lineHeight: 16, paddingHorizontal: 20 },
});
