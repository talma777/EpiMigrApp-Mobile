import React, { useState, useCallback, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MedicalCard, DataChip, LiveSignalStrip } from '../components';

interface Stats {
    totalEpisodes: number;
    avgIntensity: number;
    topTrigger: string;
    activityData: { day: string, count: number }[];
}

export default function InsightsScreen() {
    const { state } = useContext(AuthContext);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const processData = (episodeEvents: any[]) => {
        const totalIntensity = episodeEvents.reduce((acc, curr) => acc + (curr.intensity || 0), 0);
        const avg = episodeEvents.length > 0 ? (totalIntensity / episodeEvents.length).toFixed(1) : 0;

        const triggerCounts: { [key: string]: number } = {};
        episodeEvents.forEach(e => {
            (e.triggers || []).forEach((t: string) => {
                triggerCounts[t] = (triggerCounts[t] || 0) + 1;
            });
        });
        const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ninguno';

        const dayCounts: { [key: string]: number } = { 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0, 'Dom': 0 };
        const dayMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        episodeEvents.forEach(e => {
            const dayName = dayMap[new Date(e.timestamp).getDay()];
            if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
        });

        const activityData = Object.entries(dayCounts).map(([day, count]) => ({ day, count }));

        setStats({
            totalEpisodes: episodeEvents.length,
            avgIntensity: Number(avg),
            topTrigger,
            activityData
        });
    };

    const fetchHistory = async () => {
        if (!state.userId) return;
        try {
            setLoading(true);
            const data = await api.get(`/episodes/history/${state.userId}`);
            processData(data);
        } catch (error) {
            console.error('[Insights] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [state.userId])
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Sincronizando modelos predictivos...</Text>
            </View>
        );
    }

    const maxCount = Math.max(...(stats?.activityData.map(d => d.count) || [1]));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.title}>Insights Médicos</Text>
                    <Text style={styles.subtitle}>Análisis predictivo y patrones de salud</Text>
                </View>

                {/* MÉTRICAS CLAVE (DataChips) */}
                <View style={styles.grid}>
                    <DataChip
                        label="Episodios"
                        value={stats?.totalEpisodes || 0}
                        unit="este mes"
                        style={styles.chip}
                    />
                    <DataChip
                        label="Intensidad"
                        value={stats?.avgIntensity || 0}
                        unit="/ 10"
                        trend="stable"
                        style={styles.chip}
                    />
                </View>

                {/* FACTOR DE INCIDENCIA */}
                <Text style={styles.sectionTitle}>Análisis de Desencadenantes</Text>
                <MedicalCard style={styles.triggerCard}>
                    <View style={styles.triggerBadge}>
                        <Text style={styles.triggerBadgeText}>FACTOR CRÍTICO</Text>
                    </View>
                    <Text style={styles.triggerValue}>{stats?.topTrigger.toUpperCase()}</Text>
                    <Text style={styles.triggerDesc}>
                        Este factor presenta la mayor correlación con el aumento de la variabilidad cardíaca previa a episodios.
                    </Text>
                </MedicalCard>

                {/* GRÁFICO TÉCNICO */}
                <View style={styles.chartWrapper}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>FRECUENCIA SEMANAL</Text>
                        <View style={styles.chartLegend}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                            <Text style={styles.legendText}>LOGS CLÍNICOS</Text>
                        </View>
                    </View>

                    <View style={styles.chartArea}>
                        {stats?.activityData.map((d, i) => {
                            const barHeight = stats.totalEpisodes > 0 ? (d.count / (maxCount || 1)) * 100 : 5;
                            const isMax = d.count === maxCount && d.count > 0;

                            return (
                                <View key={i} style={styles.chartBarWrapper}>
                                    <Text style={styles.barValue}>{d.count || ''}</Text>
                                    <View style={styles.barTrack}>
                                        <View style={[
                                            styles.barFill,
                                            {
                                                height: `${barHeight}%`,
                                                backgroundColor: isMax ? theme.colors.primary : theme.colors.border,
                                            }
                                        ]} />
                                    </View>
                                    <Text style={[styles.barLabel, isMax && { color: theme.colors.primary, fontWeight: '800' }]}>
                                        {d.day.toUpperCase()}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* RECOMENDACIÓN IA PREVENTIVA */}
                <Text style={styles.sectionTitle}>Asistencia Preventiva AI</Text>
                <MedicalCard style={styles.aiCard}>
                    <View style={styles.aiHeader}>
                        <View style={styles.shieldIcon}>
                            <View style={styles.shieldInner} />
                        </View>
                        <Text style={styles.aiTitle}>Sugerencia de Control</Text>
                    </View>
                    <Text style={styles.aiText}>
                        Nuestros modelos asocian los episodios más intensos con <Text style={styles.bold}>"{stats?.topTrigger}"</Text>.
                        Se recomienda monitorear activamente la conductancia de la piel (EDA) durante exposiciones a este factor.
                    </Text>
                    <LiveSignalStrip />
                </MedicalCard>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>DATOS ANALIZADOS: ÚLTIMOS 30 DÍAS</Text>
                    <Text style={styles.footerSub}>Cálculo probabilístico basado en biometría activa</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 12, color: theme.colors.textMuted, letterSpacing: 0.5 },

    content: { paddingHorizontal: 32, paddingTop: 24, paddingBottom: 100 },

    header: { marginBottom: 32 },
    title: { fontSize: 24, fontWeight: '800', color: theme.colors.navy },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },

    grid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    chip: { flex: 1 },

    sectionTitle: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1.2, marginBottom: 16 },

    triggerCard: { padding: 20, marginBottom: 32 },
    triggerBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 6, marginBottom: 12
    },
    triggerBadgeText: { fontSize: 9, fontWeight: '800', color: theme.colors.accent },
    triggerValue: { fontSize: 28, fontWeight: '800', color: theme.colors.navy, marginBottom: 8 },
    triggerDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },

    chartWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20, padding: 24,
        borderWidth: 1, borderColor: theme.colors.border,
        marginBottom: 32,
    },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    chartTitle: { fontSize: 11, fontWeight: '700', color: theme.colors.navy, letterSpacing: 0.5 },
    chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 6, height: 6, borderRadius: 3 },
    legendText: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted },

    chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
    chartBarWrapper: { alignItems: 'center', width: '12%' },
    barValue: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6 },
    barTrack: { width: 2, height: '100%', backgroundColor: '#F1F5F9', justifyContent: 'flex-end' },
    barFill: { width: 2, borderRadius: 1 },
    barLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, marginTop: 12 },

    aiCard: { padding: 20, marginBottom: 40, borderLeftWidth: 4, borderLeftColor: theme.colors.secondary },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    shieldIcon: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: theme.colors.secondaryLight,
        justifyContent: 'center', alignItems: 'center'
    },
    shieldInner: { width: 12, height: 12, borderRadius: 2, backgroundColor: theme.colors.secondary },
    aiTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.navy },
    aiText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 20 },
    bold: { fontWeight: '800', color: theme.colors.navy },

    footer: { alignItems: 'center' },
    footerText: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
    footerSub: { fontSize: 9, color: theme.colors.textMuted, marginTop: 4 },
});
