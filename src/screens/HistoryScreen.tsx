import React, { useState, useCallback, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { theme } from '../theme';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MedicalCard, Logo } from '../components';

interface HistoryEvent {
    id: string;
    intensity: number;
    timestamp: string;
    triggers: string[];
    medicationTaken: boolean;
    notes: string;
    doctorComment?: string;
    isReviewed?: boolean;
    type?: 'crisis' | 'manual'; // Derivado para la UI
}

export default function HistoryScreen() {
    const { state } = useContext(AuthContext);
    const [events, setEvents] = useState<HistoryEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        return subDays(new Date(), 6 - i);
    });

    useFocusEffect(
        useCallback(() => {
            if (state.userId) {
                fetchHistory();
            }
        }, [state.userId])
    );

    const fetchHistory = async () => {
        try {
            setLoading(true);
            // CONVERGENCIA: Ahora consultamos el historial de episodios persistentes
            const data = await api.get(`/episodes/history/${state.userId}`);
            setEvents(data);
        } catch (error) {
            console.error('[HistoryScreen] Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventsForDay = (date: Date) => {
        return events.filter(e => isSameDay(new Date(e.timestamp), date));
    };

    const hasEventOnDay = (date: Date) => {
        return getEventsForDay(date).length > 0;
    };

    const selectedDayEvents = getEventsForDay(selectedDate).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>DIARIO CLÍNICO</Text>
                    <Text style={styles.subtitle}>Historial de crisis y reportes médicos</Text>
                </View>
                <TouchableOpacity style={styles.exportBtn}>
                    <Text style={styles.exportText}>EXPORTAR PDF</Text>
                </TouchableOpacity>
            </View>

            {/* WEEKLY STRIP */}
            <View style={styles.calendarStrip}>
                {weekDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const hasEvent = hasEventOnDay(date);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayItem,
                                isSelected && styles.dayItemSelected,
                            ]}
                            onPress={() => setSelectedDate(date)}
                        >
                            <Text style={[
                                styles.dayName,
                                isSelected && styles.dayNameSelected,
                                isToday && !isSelected && { color: theme.colors.primary }
                            ]}>
                                {format(date, 'eee', { locale: es }).substring(0, 1).toUpperCase()}
                            </Text>
                            <Text style={[
                                styles.dayNumber,
                                isSelected && styles.dayNumberSelected
                            ]}>
                                {format(date, 'd')}
                            </Text>
                            {hasEvent && (
                                <View style={[
                                    styles.eventIndicator,
                                    isSelected && { backgroundColor: '#fff' }
                                ]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {format(selectedDate, "EEEE d 'de' MMMM", { locale: es }).toUpperCase()}
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                        <Text style={styles.loadingText}>Sincronizando registros médicos...</Text>
                    </View>
                ) : selectedDayEvents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyShield} />
                        <Text style={styles.emptyText}>SIN EPISODIOS REGISTRADOS</Text>
                        <Text style={styles.emptySubtext}>No existen reportes coincidentes con la fecha seleccionada.</Text>
                    </View>
                ) : (
                    selectedDayEvents.map((event) => (
                        <MedicalCard key={event.id} style={styles.eventCard}>
                            <View style={styles.eventTop}>
                                <View style={[
                                    styles.typeIndicator,
                                    { backgroundColor: event.intensity > 7 ? theme.colors.riskHigh : theme.colors.primary }
                                ]} />
                                <View style={styles.eventMeta}>
                                    <View style={styles.row}>
                                        <Text style={styles.eventKind}>REPORTE CLÍNICO</Text>
                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                            {event.medicationTaken && (
                                                <View style={styles.medTag}>
                                                    <Text style={styles.medTagText}>💊 MEDICADO</Text>
                                                </View>
                                            )}
                                            {event.isReviewed && (
                                                <View style={styles.verifiedTag}>
                                                    <Text style={styles.verifiedTagText}>✓ REVISADO</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={styles.eventTime}>{format(new Date(event.timestamp), 'HH:mm')} • Monitorización Manual</Text>
                                </View>
                            </View>

                            <View style={styles.intensitySection}>
                                <View style={styles.intensityHeader}>
                                    <Text style={styles.intensityLabel}>INTENSIDAD VAS</Text>
                                    <Text style={styles.intensityNumber}>{event.intensity}/10</Text>
                                </View>
                                <View style={styles.intensityTrack}>
                                    <View style={[
                                        styles.intensityFill,
                                        {
                                            width: `${event.intensity * 10}%`,
                                            backgroundColor: event.intensity > 7 ? theme.colors.riskHigh : theme.colors.primary
                                        }
                                    ]} />
                                </View>
                            </View>

                            {event.notes ? (
                                <View style={styles.notesBox}>
                                    <Text style={styles.notesContent}>"{event.notes}"</Text>
                                </View>
                            ) : null}

                            {event.doctorComment ? (
                                <View style={styles.doctorNoteBox}>
                                    <Text style={styles.doctorNoteLabel}>OBSERVACIÓN MÉDICA:</Text>
                                    <Text style={styles.doctorNoteContent}>{event.doctorComment}</Text>
                                </View>
                            ) : null}

                            {event.triggers && event.triggers.length > 0 ? (
                                <View style={styles.triggersRow}>
                                    {event.triggers.map((t, idx) => (
                                        <View key={idx} style={styles.triggerChip}>
                                            <Text style={styles.triggerChipText}>{t.toUpperCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </MedicalCard>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 32, paddingTop: 20, marginBottom: 32,
    },
    title: { fontSize: 20, fontWeight: '900', color: theme.colors.navy, letterSpacing: 1 },
    subtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
    exportBtn: {
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#F1F5F9', backgroundColor: '#fff',
    },
    exportText: { fontSize: 9, fontWeight: '800', color: theme.colors.navy, letterSpacing: 1 },

    calendarStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 40 },
    dayItem: {
        alignItems: 'center', paddingVertical: 14, width: 44, borderRadius: 12,
        backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F1F5F9',
    },
    dayItemSelected: {
        backgroundColor: theme.colors.navy, borderColor: theme.colors.navy,
        shadowColor: theme.colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    dayName: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, marginBottom: 6 },
    dayNameSelected: { color: 'rgba(255,255,255,0.6)' },
    dayNumber: { fontSize: 16, fontWeight: '900', color: theme.colors.navy },
    dayNumberSelected: { color: '#FFFFFF' },
    eventIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.primary, marginTop: 6 },

    content: { paddingHorizontal: 32, paddingBottom: 100 },
    sectionHeader: { marginBottom: 20 },
    sectionTitle: { fontSize: 9, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5 },

    loadingBox: { alignItems: 'center', marginTop: 40 },
    loadingText: { marginTop: 12, fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, letterSpacing: 0.5 },

    emptyState: {
        alignItems: 'center', marginTop: 40, padding: 40, borderRadius: 24,
        backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F1F5F9', borderStyle: 'dashed',
    },
    emptyShield: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 20 },
    emptyText: { fontSize: 11, fontWeight: '900', color: theme.colors.navy, letterSpacing: 1 },
    emptySubtext: { textAlign: 'center', fontSize: 13, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },

    eventCard: { marginBottom: 16, padding: 20 },
    eventTop: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    typeIndicator: { width: 4, height: 32, borderRadius: 2 },
    eventMeta: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eventKind: { fontSize: 10, fontWeight: '900', color: theme.colors.navy, letterSpacing: 1 },
    eventTime: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
    medTag: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    medTagText: { fontSize: 8, fontWeight: '800', color: theme.colors.accent },
    verifiedTag: { backgroundColor: 'rgba(79, 70, 229, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    verifiedTagText: { fontSize: 8, fontWeight: '800', color: theme.colors.primary },

    intensitySection: { marginBottom: 20 },
    intensityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    intensityLabel: { fontSize: 9, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 0.5 },
    intensityNumber: { fontSize: 13, fontWeight: '900', color: theme.colors.navy },
    intensityTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3 },
    intensityFill: { height: '100%', borderRadius: 3 },

    notesBox: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, marginBottom: 12 },
    notesContent: { fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },

    doctorNoteBox: { backgroundColor: '#EEF2FF', padding: 14, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
    doctorNoteLabel: { fontSize: 9, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1, marginBottom: 4 },
    doctorNoteContent: { fontSize: 13, color: theme.colors.navy, fontWeight: '600', lineHeight: 20 },

    triggersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    triggerChip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    triggerChipText: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted },
});
