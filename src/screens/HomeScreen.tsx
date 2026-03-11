import React, { useEffect, useState, useContext, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, Animated, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { biometrics, RiskAnalysis } from '../services/BiometricsService';
import { theme, backendRiskToLevel } from '../theme';
import { Logo, RiskOrb, DataChip, LiveSignalStrip, MedicalCard } from '../components';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { state } = useContext(AuthContext);
    const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [wearableSource, setWearableSource] = useState('—');
    const [tooltip, setTooltip] = useState<{ title: string; content: string } | null>(null);

    // Animaciones de entrada
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (!state.userId) return;

        biometrics.startMonitoring(
            state.userId,
            (result) => {
                setAnalysis(result);
                if (loading) {
                    setLoading(false);
                    // Trigger entrance animation
                    Animated.parallel([
                        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: false })
                    ]).start();
                }
            },
            (status) => {
                setWearableSource(status.source);
            },
        ).catch(console.warn);

        // Eliminamos biometrics.stopMonitoring() de aquí para que sea persistente
    }, [state.userId]);

    const currentLevel = analysis ? (analysis.riskLevel.toLowerCase() as any) : 'low';
    const ci = analysis?.clinicalIndex || 0;
    const ipc = analysis?.protectionIndex || 0;
    const lambda = analysis?.lambdaProbability || 0;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Logo size="md" showClaim={false} />
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 24 }} />
                <Text style={styles.loadingText}>SINCRONIZANDO BIOMETRÍA...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* TOP BAR */}
            <View style={styles.topNav}>
                <Logo size="sm" showClaim={true} />
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
                    <View style={styles.profileInitial}>
                        <Text style={styles.profileText}>
                            {state.email ? state.email[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {/* LIVE STATUS BAR */}
                    <View style={styles.liveWrapper}>
                        <LiveSignalStrip />
                    </View>

                    {/* HERO SECTION: THE RISK ORB */}
                    <View style={styles.heroSection}>
                        <View style={styles.orbWrapper}>
                            <RiskOrb riskLevel={currentLevel === 'critical' ? 'high' : currentLevel} score={ci / 100} size="lg" />
                            <View style={styles.scoreOverlay}>
                                <Text style={styles.scoreValue}>{ci}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.scoreLabel}>CLINICAL INDEX</Text>
                                    <TouchableOpacity onPress={() => setTooltip({
                                        title: 'Clinical Index (CI)',
                                        content: 'El CI es tu termómetro neurológico.\n\n🟢 Verde (0-30): Estable.\n🟡 Amarillo (31-70): Riesgo Moderado.\n🟠 Naranja (71-89): Monitoreo Alto.\n🔴 Rojo (90-100): Alerta inminente.'
                                    })} style={styles.darkInfoIcon}>
                                        <Text style={styles.darkInfoText}>?</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.statusTitle}>
                            {currentLevel === 'critical' ? 'ALERTA CRÍTICA' : currentLevel === 'high' ? 'MONITOREO ALTO' : currentLevel === 'medium' ? 'RIESGO MODERADO' : 'ESTADO ESTABLE'}
                        </Text>
                    </View>

                    {/* BIOMETRIC GRID - Includes IPC and Lambda */}
                    <View style={styles.chipsGrid}>
                        <DataChip
                            label="Blindaje (IPC)"
                            value={ipc}
                            unit="%"
                            trend={ipc > 70 ? 'up' : 'down'}
                            style={{ flex: 1 }}
                            onInfoPress={() => setTooltip({
                                title: 'Índice de Protección Clínica',
                                content: 'Mide qué tan protegido está tu sistema neurológico. Considera tu descanso, adherencia a medicación y hábitos recientes. Cuanto más cerca del 100%, más blindado estás frente a crisis.'
                            })}
                        />
                        <DataChip
                            label="Prob (λ)"
                            value={lambda}
                            unit=""
                            trend={lambda > 0.3 ? 'up' : 'stable'}
                            style={{ flex: 1 }}
                            onInfoPress={() => setTooltip({
                                title: 'Probabilidad Matemática (λ)',
                                content: 'Es la variable algorítmica de riesgo a corto plazo calculada por la I.A. Un valor mayor a 0.3 indica que tu riesgo está creciendo aceleradamente en este momento.'
                            })}
                        />
                        <DataChip
                            label="Estrés"
                            value={analysis?.factors?.find(f => f.signal.toLowerCase().includes('eda'))?.value || '1.1'}
                            unit="µS"
                            trend="stable"
                            style={{ flex: 1 }}
                            onInfoPress={() => setTooltip({
                                title: 'Carga Alostática (Estrés)',
                                content: 'Nivel de actividad actual de tu sistema nervioso simpático, inferido de tu biometría. Valores altos constantes revelan estrés fisiológico que desgasta tu blindaje.'
                            })}
                        />
                    </View>

                    {/* FUENTE DE VERIFICACIÓN Y TIMESTAMP */}
                    <View style={styles.sourceContainer}>
                        <View style={styles.sourceGroup}>
                            <Text style={styles.sourceLabel}>ORIGEN:</Text>
                            <View style={styles.sourceBadge}>
                                <Text style={styles.sourceText}>
                                    {wearableSource === 'mock_simulation' ? 'SIMULACIÓN A.I.' : 'HARDWARE (BT) 📶'}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.syncText, wearableSource !== 'mock_simulation' && { color: theme.colors.accent, fontWeight: '800' }]}>
                            {wearableSource === 'mock_simulation' ? 'Modo Demo' : '🔴 VIVO - ANALIZANDO'}
                        </Text>
                    </View>

                    {/* ORÁCULO DE CLIMA - INTEGRACIÓN CRÍTICA */}
                    {analysis?.factors?.some(f => f.signal.toLowerCase().includes('clima')) && (
                        <View style={styles.weatherSection}>
                            <MedicalCard style={styles.weatherCard}>
                                <View style={styles.weatherHeader}>
                                    <Text style={styles.weatherTitle}>📡 ORÁCULO DE CLIMA (FACTOR BAROMÉTRICO)</Text>
                                </View>
                                <View style={styles.weatherBody}>
                                    <View style={styles.weatherStat}>
                                        <Text style={styles.weatherValue}>
                                            {analysis.factors.find(f => f.signal.toLowerCase().includes('clima'))?.value.toFixed(0)}%
                                        </Text>
                                        <Text style={styles.weatherLabel}>IMPACTO EN CI</Text>
                                    </View>
                                    <View style={styles.weatherInfo}>
                                        <Text style={styles.weatherStatus}>
                                            {analysis.factors.find(f => f.signal.toLowerCase().includes('clima'))?.contribution! > 0.5 
                                                ? '⚠️ PRESIÓN BAJA DETECTADA' 
                                                : '✅ PRESIÓN ESTABLE'}
                                        </Text>
                                        <Text style={styles.weatherDesc}>
                                            {analysis.factors.find(f => f.signal.toLowerCase().includes('clima'))?.contribution! > 0.5 
                                                ? 'La caída de presión atmosférica está sensibilizando su sistema nervioso.' 
                                                : 'Sin alertas ambientales significativas en su ubicación actual.'}
                                        </Text>
                                    </View>
                                </View>
                            </MedicalCard>
                        </View>
                    )}

                    {/* PREVENTIVE INSIGHT */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>RECOMENDACIÓN CLÍNICA</Text>
                    </View>

                    <MedicalCard style={styles.insightCard}>
                        <View style={[styles.indicator, { backgroundColor: (currentLevel === 'high' || currentLevel === 'critical') ? theme.colors.riskHigh : theme.colors.primary }]} />
                        <View style={styles.insightText}>
                            <Text style={styles.insightTitle}>Acción Sugerida</Text>
                            <Text style={styles.insightSub}>
                                {analysis?.recommendedActions?.[0] || 'Calibrando signos vitales.'}
                            </Text>
                        </View>
                    </MedicalCard>

                    {/* ACTIONS */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.primaryAction}
                            onPress={() => navigation.navigate('Episode')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.actionLabel}>REGISTRAR CRISIS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sosSecondary}
                            onPress={() => navigation.navigate('SOS')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.sosLabel}>ASISTENCIA SOS</Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>

            </ScrollView>

            {/* TOOLTIP MODAL */}
            <Modal visible={!!tooltip} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setTooltip(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.tooltipBox}>
                                <Text style={styles.tooltipTitle}>{tooltip?.title}</Text>
                                <Text style={styles.tooltipText}>{tooltip?.content}</Text>
                                <TouchableOpacity onPress={() => setTooltip(null)} style={styles.tooltipBtn} activeOpacity={0.8}>
                                    <Text style={styles.tooltipBtnText}>ENTENDIDO</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topNav: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
    },
    scroll: { paddingBottom: 60 },
    profileBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    profileInitial: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    profileText: { fontSize: 13, fontWeight: '800', color: theme.colors.navy },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 24, color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },

    liveWrapper: { alignSelf: 'center', marginBottom: 24 },

    heroSection: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 40 },
    orbWrapper: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    scoreOverlay: { position: 'absolute', alignItems: 'center' },
    scoreValue: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2 },
    scoreLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },

    statusTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.navy, letterSpacing: 1, marginBottom: 8 },
    statusDescription: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

    darkInfoIcon: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginTop: -2 },
    darkInfoText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.95)' },

    chipsGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 40 },

    sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: theme.colors.textMuted, letterSpacing: 2 },

    insightCard: {
        marginHorizontal: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
        marginBottom: 40,
    },
    indicator: { width: 4, height: 40, borderRadius: 2 },
    insightText: { flex: 1 },
    insightTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.navy, marginBottom: 2 },
    insightSub: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },

    actionsContainer: { paddingHorizontal: 24, gap: 12 },
    primaryAction: {
        backgroundColor: theme.colors.navy, paddingVertical: 20, borderRadius: 20,
        alignItems: 'center', shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
    },
    actionLabel: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
    sosSecondary: {
        paddingVertical: 18, borderRadius: 20, alignItems: 'center',
        borderWidth: 2, borderColor: theme.colors.danger,
    },
    sosLabel: { color: theme.colors.danger, fontSize: 13, fontWeight: '800', letterSpacing: 2 },

    sourceContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 32, paddingHorizontal: 24
    },
    sourceGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sourceLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
    sourceBadge: {
        backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0'
    },
    sourceText: { fontSize: 8, fontWeight: '800', color: theme.colors.navy, letterSpacing: 0.5 },
    syncText: { fontSize: 9, fontWeight: '700', color: theme.colors.accent, letterSpacing: 0.5 },
    
    // WEATHER ORACLE STYLES
    weatherSection: { paddingHorizontal: 24, marginBottom: 32 },
    weatherCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, padding: 16 },
    weatherHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    weatherTitle: { fontSize: 10, fontWeight: '900', color: theme.colors.accent, letterSpacing: 1 },
    weatherBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    weatherStat: { alignItems: 'center', borderRightWidth: 1, borderRightColor: '#CBD5E1', paddingRight: 20 },
    weatherValue: { fontSize: 24, fontWeight: '900', color: theme.colors.navy },
    weatherLabel: { fontSize: 8, fontWeight: '700', color: theme.colors.textMuted },
    weatherInfo: { flex: 1 },
    weatherStatus: { fontSize: 13, fontWeight: '800', color: theme.colors.navy, marginBottom: 4 },
    weatherDesc: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    tooltipBox: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
    tooltipTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.navy, marginBottom: 12, letterSpacing: 0.5 },
    tooltipText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 24 },
    tooltipBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    tooltipBtnText: { fontSize: 12, fontWeight: '800', color: theme.colors.navy, letterSpacing: 1.5 },
});

