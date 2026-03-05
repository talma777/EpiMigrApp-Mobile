import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Logo } from '../components';

export default function WelcomeScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Logo Hero */}
                <View style={styles.logoSection}>
                    <Logo size="lg" showClaim={true} />
                </View>

                {/* Hero Headliner */}
                <View style={styles.hero}>
                    <Text style={styles.headline}>El estándar digital en neurología clínica.</Text>
                    <Text style={styles.subheadline}>
                        Sistemas predictivos para el manejo de epilepsia y migraña, diseñados con rigor médico y empatía humana.
                    </Text>
                </View>

                {/* Clinical Pillars */}
                <View style={styles.features}>
                    {[
                        { title: 'IA Predictiva', desc: 'Detección anticipada de crisis biometría activa.' },
                        { title: 'Control Clínico', desc: 'Historial estructurado para exportación médica.' },
                        { title: 'Asistencia SOS', desc: 'Protocolos de emergencia vinculados a contactos.' },
                    ].map((f, i) => (
                        <View key={i} style={styles.featureItem}>
                            <View style={styles.featureIndicator} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            {/* Premium CTA Block */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.9}
                >
                    <Text style={styles.primaryBtnText}>INGRESAR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryBtnText}>REGISTRARSE</Text>
                </TouchableOpacity>

                <View style={styles.complianceRow}>
                    <Text style={styles.complianceText}>ENCRIPTACIÓN PUNTA A PUNTA | COMPLIANCE GDPR</Text>
                </View>

                <View style={styles.disclaimerBox}>
                    <Text style={styles.disclaimerText}>
                        AVISO MÉDICO: EpiMigrApp es una herramienta de soporte y monitoreo. No constituye un diagnóstico médico vinculante ni reemplaza la consulta con un profesional de la salud. En caso de emergencia, contacte a sus servicios locales inmediatamente.
                    </Text>
                </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollView: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 40, paddingBottom: 20 },

    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },

    hero: { marginBottom: 40 },
    headline: {
        fontSize: 32, fontWeight: '800',
        color: theme.colors.navy,
        lineHeight: 40, letterSpacing: -0.5,
        marginBottom: 16,
    },
    subheadline: {
        fontSize: 15, color: theme.colors.textSecondary,
        lineHeight: 24, opacity: 0.9
    },

    features: { gap: 16, marginBottom: 24 },
    featureItem: {
        flexDirection: 'row', gap: 16,
    },
    featureIndicator: {
        width: 3, height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
        opacity: 0.3
    },
    featureTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.navy, letterSpacing: 0.5, marginBottom: 4 },
    featureDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },

    footer: { paddingHorizontal: 32, paddingVertical: 20, gap: 12 },
    primaryBtn: {
        backgroundColor: theme.colors.navy,
        height: 56, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
    },
    primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    secondaryBtn: {
        height: 56, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: theme.colors.border,
    },
    secondaryBtnText: { color: theme.colors.navy, fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    complianceRow: { marginTop: 8, alignItems: 'center' },
    complianceText: { fontSize: 9, color: theme.colors.textMuted, letterSpacing: 1, fontWeight: '600' },
    disclaimerBox: { marginTop: 12, paddingHorizontal: 12 },
    disclaimerText: { fontSize: 8, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 12, opacity: 0.8 },
});
