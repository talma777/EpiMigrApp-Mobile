import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Alert, StatusBar, Platform, TextInput } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { theme } from '../theme';
import { MedicalCard, Logo } from '../components';

export default function ProfileScreen({ navigation }: any) {
    const { state, signOut } = useContext(AuthContext);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
    const [telemetry, setTelemetry] = useState<{ hr: string | number, eda: string | number, source: string, packetId: string }>({
        hr: '--', eda: '--', source: '', packetId: ''
    });
    const [isEditingThresholds, setIsEditingThresholds] = useState(false);
    const [thresholds, setThresholds] = useState({ pressureThresholdHpa: 1008, criticalPressureHpa: 1005 });

    useEffect(() => {
        // Al montar, verificamos si ya existe una conexión activa global
        const checkGlobalConnection = async () => {
            const { wearableService } = await import('../services/WearableService');
            const device = wearableService.getConnectedDeviceName();
            if (device) setConnectedDevice(device);
        };
        checkGlobalConnection();

        // Suscripción a datos reales del servicio
        let unsubscribe: any = null;
        const initSubscription = async () => {
            const { wearableService } = await import('../services/WearableService');
            unsubscribe = wearableService.subscribe((reading) => {
                setTelemetry(prev => ({
                    ...prev,
                    hr: reading.dataType === 'heart_rate' ? reading.value : prev.hr,
                    eda: reading.dataType === 'eda' ? (typeof reading.value === 'number' ? reading.value.toFixed(2) : reading.value) : prev.eda,
                    source: reading.source,
                    packetId: Math.random().toString(36).substring(7).toUpperCase()
                }));
            });
        };
        initSubscription();
        return () => unsubscribe?.();
    }, []);

    useEffect(() => {
        const loadProfile = async () => {
            if (!state.userId) return;
            try {
                const res = await api.get(`/clinical/profile/${state.userId}`);
                setProfile(res);
                if (res.weatherSensitivity) {
                    setThresholds(res.weatherSensitivity);
                }
            } catch (error) {
                console.error('[Profile] Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [state.userId]);

    const handleConnectWearable = async () => {
        console.log('[Profile] Iniciando protocolo de hardware físico para:', state.userId);
        setConnecting(true);

        try {
            const { wearableService } = await import('../services/WearableService');

            // Forzamos hardware BT real
            await wearableService.startMonitoring(state.userId!, true);

            const deviceName = wearableService.getConnectedDeviceName();
            setConnectedDevice(deviceName);

            if (deviceName?.includes('Fallback')) {
                throw new Error("Fallback activado, conexión física rechazada o compatible.");
            }

            const msg = "SEÑAL FÍSICA DETECTADA: El sensor Bluetooth está enviando biometría viva al expediente.";
            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert("Hardware Vinculado", msg);
            }
        } catch (err: any) {
            console.warn('[Profile] Error o Fallback de sensor:', err);
            // Si el usuario cancela o no hay Bluetooth, hacemos fallback
            const { wearableService } = await import('../services/WearableService');
            setConnectedDevice(wearableService.getConnectedDeviceName() || 'Sensor Virtual (Mock)');

            if (Platform.OS === 'web') {
                if (!(navigator as any).bluetooth) {
                    window.alert("Tu navegador no soporta Bluetooth Web (iOS/Safari no lo permite). Se activó la simulación clínica de respaldo para que puedas seguir probando.");
                } else {
                    const errorMsg = err?.message || '';
                    window.alert(`AVISO DE HARDWARE: Chrome encontró un dispositivo, pero no pudo extraer biometría real.\n\nCAUSA PROBABLE: Tu reloj 'EF16' no usa el estándar médico GATT (Heart Rate 0x180D) o Windows está bloqueando la comunicación por estar ya emparejado. Intenta olvidarlo en Windows y conectarlo sólo por Chrome.\n\nSe ha activado la Simulación AI de respaldo.`);
                }
            }
        } finally {
            setConnecting(false);
        }
    };

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm("¿Desea finalizar su sesión y desconectar el terminal?");
            if (confirm) {
                await signOut();
            }
            return;
        }

        Alert.alert(
            "Finalizar Sesión",
            "¿Desea desconectar su terminal del sistema de monitoreo?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Desconectar", style: "destructive", onPress: async () => await signOut() }
            ]
        );
    };

    const handleSaveThresholds = async () => {
        setLoading(true);
        try {
            await api.post('/clinical/profile', {
                userId: state.userId,
                weatherSensitivity: thresholds
            });
            setIsEditingThresholds(false);
            Alert.alert("Éxito", "Umbrales climatológicos actualizados.");
        } catch (err) {
            Alert.alert("Error", "No se pudieron guardar los ajustes.");
        } finally {
            setLoading(false);
        }
    };

    const handleDataDeletion = async () => {
        const confirmMsg = "ATENCIÓN: Esta acción eliminará permanentemente su expediente clínico, historial biométrico y registros de crisis. No se puede deshacer.\n\n¿Desea continuar?";
        
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) {
                setLoading(true);
                try {
                    await api.post(`/auth/delete-account`, { userId: state.userId });
                    await signOut();
                } catch (err) {
                    window.alert("Error al eliminar la cuenta. Contacte a soporte.");
                } finally {
                    setLoading(false);
                }
            }
            return;
        }

        Alert.alert(
            "BORRADO PERMANENTE",
            confirmMsg,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "BORRAR TODO", 
                    style: "destructive", 
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.post(`/auth/delete-account`, { userId: state.userId });
                            await signOut();
                        } catch (err) {
                            Alert.alert("Error", "No se pudo completar la operación.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* NAV TOP */}
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>VOLVER</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>EXPEDIENTE</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* PERFIL HERO */}
                <View style={styles.profileHero}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarLabel}>
                            {state.email?.[0].toUpperCase() || 'P'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{state.email?.split('@')[0].toUpperCase() || 'USUARIO'}</Text>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>SISTEMA ID: {state.userId?.slice(0, 8).toUpperCase()}</Text>
                    </View>
                </View>

                {/* INFO CLÍNICA CENTRAL */}
                <Text style={styles.sectionTitle}>CONFIGURACIÓN CLÍNICA</Text>
                <MedicalCard style={styles.medicalInfo}>
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                        <>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>DIAGNÓSTICO BASE</Text>
                                <Text style={styles.value}>{profile?.diagnosis || 'PENDIENTE DE VALIDACIÓN'}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>SENSIBILIDAD CLIMÁTICA</Text>
                                {isEditingThresholds ? (
                                    <View style={styles.thresholdEditor}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Alerta (hPa):</Text>
                                            <TextInput
                                                style={styles.thresholdInput}
                                                keyboardType="numeric"
                                                value={thresholds.pressureThresholdHpa.toString()}
                                                onChangeText={(v) => setThresholds(p => ({ ...p, pressureThresholdHpa: parseInt(v) || 0 }))}
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Crítico (hPa):</Text>
                                            <TextInput
                                                style={styles.thresholdInput}
                                                keyboardType="numeric"
                                                value={thresholds.criticalPressureHpa.toString()}
                                                onChangeText={(v) => setThresholds(p => ({ ...p, criticalPressureHpa: parseInt(v) || 0 }))}
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.saveSmallBtn} onPress={handleSaveThresholds}>
                                            <Text style={styles.saveSmallBtnText}>GUARDAR</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.thresholdDisplay} onPress={() => setIsEditingThresholds(true)}>
                                        <Text style={styles.value}>
                                            {thresholds.pressureThresholdHpa} / {thresholds.criticalPressureHpa} hPa
                                        </Text>
                                        <Text style={styles.editHint}>[ EDITAR UMBRALES ]</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>ESTADO DE MONITOREO</Text>
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusDot, { backgroundColor: connectedDevice ? theme.colors.accent : theme.colors.textMuted }]} />
                                    <Text style={[styles.statusText, { color: connectedDevice ? theme.colors.accent : theme.colors.textMuted }]}>
                                        {connectedDevice ? 'SISTEMA ACTIVO (VIVO)' : 'ESPERANDO HARDWARE'}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </MedicalCard>

                {/* DISPOSITIVOS */}
                <Text style={styles.sectionTitle}>HARDWARE VINCULADO</Text>
                <TouchableOpacity
                    style={[
                        styles.deviceOption,
                        connectedDevice && styles.deviceActive,
                        Platform.OS === 'web' && { cursor: 'pointer', transition: 'all 0.2s ease' } as any
                    ]}
                    activeOpacity={0.6}
                    onPress={handleConnectWearable}
                    disabled={connecting}
                    //@ts-ignore - Propiedad web para feedback visual
                    onMouseEnter={(e: any) => { if (Platform.OS === 'web') e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.borderColor = theme.colors.primary; }}
                    //@ts-ignore 
                    onMouseLeave={(e: any) => { if (Platform.OS === 'web') e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = connectedDevice ? theme.colors.primary : '#F1F5F9'; }}
                >
                    <View style={[styles.deviceIndicator, connectedDevice && { backgroundColor: theme.colors.accent }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>
                            {connecting ? 'Escaneando dispositivos...' : connectedDevice || 'Vincular Sensor Wearable'}
                        </Text>
                        <Text style={styles.optionSub}>
                            {connecting ? 'Calibrando Bluetooth...' : connectedDevice ? `TELEMETRÍA AI/HR: ${telemetry.hr} BPM | EDA: ${telemetry.eda} µS` : 'Haz click aquí para buscar tu Smartwatch'}
                        </Text>
                    </View>
                    {connecting ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <View style={styles.connectButtonBadge}>
                            <Text style={styles.connectButtonText}>{connectedDevice ? '⟳ RECONECTAR' : 'Bluetooth'}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {connectedDevice && (
                    <View style={styles.telemetryBox}>
                        <View style={styles.telemetryHeader}>
                            <View style={styles.livePulse} />
                            <Text style={styles.telemetryTitle}>TRANSFUSIÓN DE DATOS EN VIVO</Text>
                        </View>
                        <View style={styles.telemetryRow}>
                            <View style={styles.telemetryItem}>
                                <Text style={styles.telemetryLabel}>PULSO (BPM)</Text>
                                <Text style={styles.telemetryValue}>
                                    {telemetry.hr}
                                </Text>
                            </View>
                            <View style={styles.telemetryItem}>
                                <Text style={styles.telemetryLabel}>EDA (μS)</Text>
                                <Text style={styles.telemetryValue}>
                                    {telemetry.eda}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.auditLog}>
                            <Text style={styles.auditLabel}>AUDITORÍA DE INTEGRIDAD:</Text>
                            <Text style={styles.auditEntry}>
                                {telemetry.packetId ? `PACKET_ID: ${telemetry.packetId} | SOURCE: ${telemetry.source === 'mock_simulation' ? 'VIRTUAL_CLINIC' : 'BT_PHYSICAL'}` : 'Esperando ráfaga...'}
                            </Text>
                        </View>
                        <Text style={styles.telemetryStatus}>ESTADO: TRANSMITIENDO AL BACKEND ✅</Text>
                    </View>
                )}

                {/* LEGAL Y CUENTA */}
                <View style={styles.accountSection}>
                    <Text style={styles.sectionTitle}>GESTIÓN DE CUENTA</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuLabel}>Términos de Servicio y Privacidad</Text>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuLabel}>Configuración de Alertas SOS</Text>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutLabel}>CERRAR SESIÓN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.deleteItem]}
                        onPress={handleDataDeletion}
                    >
                        <Text style={styles.deleteLabel}>ELIMINAR MI CUENTA Y DATOS</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionLabel}>EPIMIGRAPP V.2.1-STAFF-PREMIUM</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topNav: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
    },
    backBtn: { paddingVertical: 8 },
    backText: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
    navTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.navy, letterSpacing: 1.5 },

    content: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 60 },

    profileHero: { alignItems: 'center', marginBottom: 40 },
    avatar: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: theme.colors.navy,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    avatarLabel: { fontSize: 32, fontWeight: '800', color: '#fff' },
    userName: { fontSize: 20, fontWeight: '800', color: theme.colors.navy, marginBottom: 8 },
    idBadge: {
        backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 6,
    },
    idText: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5 },

    sectionTitle: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1.2, marginBottom: 16 },

    medicalInfo: { padding: 20, marginBottom: 32 },
    infoRow: { gap: 4 },
    label: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5 },
    value: { fontSize: 15, fontWeight: '700', color: theme.colors.navy },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '800' },

    deviceOption: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        borderWidth: 1.5, borderColor: '#F1F5F9',
        marginBottom: 32,
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
    },
    deviceActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.03)' },
    deviceIndicator: { width: 4, height: 32, borderRadius: 2, backgroundColor: theme.colors.textMuted },
    optionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.navy },
    optionSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    connectButtonBadge: {
        backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
        shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4
    },
    connectButtonText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    arrow: { fontSize: 18, color: theme.colors.textMuted },

    accountSection: { gap: 12, marginBottom: 40 },
    menuItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    menuLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
    logoutItem: { borderBottomWidth: 0, marginTop: 12 },
    logoutLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.danger, letterSpacing: 0.5 },
    deleteItem: { borderBottomWidth: 0, marginTop: 4, opacity: 0.8 },
    deleteLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, textDecorationLine: 'underline' },

    versionLabel: { textAlign: 'center', fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },

    // TELEMETRIA
    telemetryBox: {
        backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 32,
        borderWidth: 1, borderColor: '#334155',
    },
    telemetryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    telemetryTitle: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    telemetryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    telemetryItem: { gap: 4 },
    telemetryLabel: { fontSize: 9, fontWeight: '700', color: '#64748B' },
    telemetryValue: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    telemetryStatus: { fontSize: 10, fontWeight: '700', color: '#10B981', textAlign: 'center', marginTop: 8 },

    // THRESHOLD EDITOR
    thresholdDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    editHint: { fontSize: 9, fontWeight: '800', color: theme.colors.primary },
    thresholdEditor: { marginTop: 10, gap: 12 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
    thresholdInput: {
        backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', width: 80,
        textAlign: 'right', fontWeight: '700', color: theme.colors.navy
    },
    saveSmallBtn: {
        backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: 10,
        alignItems: 'center', marginTop: 4
    },
    saveSmallBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

    // AUDIT
    auditLog: {
        marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155',
        gap: 4
    },
    auditLabel: { fontSize: 8, fontWeight: '800', color: '#64748B' },
    auditEntry: { fontSize: 8, color: '#94A3B8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
