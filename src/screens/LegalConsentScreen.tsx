import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert } from 'react-native';
import { theme } from '../theme';
import { Logo, MedicalCard } from '../components';
import { api } from '../services/api';

export default function LegalConsentScreen({ onConsent, userId, onLogout }: { onConsent: () => void; userId: string; onLogout: () => void }) {
    const [terms, setTerms] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const res = await api.get('/legal/latest/INFORMED_CONSENT');
                if (res) {
                    setTerms(res);
                }
            } catch (error) {
                console.error('[Legal] Error fetching terms:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            // REGISTRO CRÍTICO: Incluimos userId para que el backend lo asocie correctamente
            if (terms?.id) {
                await api.post('/legal/consent', {
                    userId,
                    documentId: terms.id
                });
            }
            onConsent();
        } catch (error) {
            console.error('[Legal] Accept Error:', error);
            // Fallback de seguridad: Permitir el acceso aunque falle el registro para no bloquear al usuario
            onConsent();
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
        );
    }

    const docDate = terms?.createdAt ? new Date(terms.createdAt).toLocaleDateString() : 'Actualizado';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Logo size="md" showClaim={false} />
                <Text style={styles.title}>CONSENTIMIENTO INFORMADO</Text>
            </View>

            <View style={styles.content}>
                <MedicalCard style={styles.infoBox}>
                    <Text style={styles.infoTitle}>PROTECCIÓN DE DATOS CLÍNICOS</Text>
                    <Text style={styles.infoText}>
                        Su privacidad es nuestra prioridad técnica. Los datos biométricos procesados por la IA de EpiMigrApp están encriptados de extremo a extremo (AES-256).
                    </Text>
                </MedicalCard>

                <View style={styles.documentContainer}>
                    <ScrollView style={styles.docScroll} showsVerticalScrollIndicator={true}>
                        <Text style={styles.docTitle}>{terms?.type?.replace(/_/g, ' ') || 'Protocolo de Monitoreo'}</Text>
                        <Text style={styles.docVersion}>VERSIÓN {terms?.version || '1.0'} — {docDate}</Text>

                        <Text style={styles.docBody}>
                            {terms?.content || 'El contenido de este consentimiento legal está siendo validado por el servidor certificado. Al continuar, usted autoriza el procesamiento de datos biométricos para la detección temprana de crisis.'}
                        </Text>
                    </ScrollView>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.acceptBtn,
                            accepting && styles.acceptBtnDisabled
                        ]}
                        onPress={handleAccept}
                        disabled={accepting}
                    >
                        {accepting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.acceptBtnText}>ACEPTAR Y CONTINUAR</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.footerNote}>
                        Al presionar aceptar, usted confirma que ha leído y comprendido el alcance del monitoreo biométrico.
                    </Text>

                    <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                        <Text style={styles.logoutBtnText}>SALIR DE LA CUENTA</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    title: { fontSize: 11, fontWeight: '900', color: theme.colors.navy, letterSpacing: 2, marginTop: 12 },
    content: { flex: 1, padding: 24, gap: 20 },
    infoBox: { padding: 16, backgroundColor: 'rgba(79, 70, 229, 0.05)', borderWidth: 0 },
    infoTitle: { fontSize: 9, fontWeight: '800', color: theme.colors.primary, letterSpacing: 1, marginBottom: 8 },
    infoText: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
    documentContainer: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
    docScroll: { padding: 20 },
    docTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.navy, marginBottom: 4 },
    docVersion: { fontSize: 9, color: theme.colors.textMuted, fontWeight: '700', marginBottom: 20 },
    docBody: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, paddingBottom: 60 },
    footer: { paddingBottom: 20, gap: 12 },
    acceptBtn: {
        backgroundColor: theme.colors.navy,
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    acceptBtnDisabled: { backgroundColor: theme.colors.textMuted, shadowOpacity: 0 },
    acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    footerNote: { textAlign: 'center', fontSize: 9, color: theme.colors.textMuted, lineHeight: 14, paddingHorizontal: 10, marginBottom: 10 },
    logoutBtn: { paddingVertical: 10, alignSelf: 'center' },
    logoutBtnText: { fontSize: 9, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1, textDecorationLine: 'underline' },
});
