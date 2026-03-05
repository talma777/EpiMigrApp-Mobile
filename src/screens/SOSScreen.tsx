import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    Linking, StatusBar, Animated, Alert, ScrollView
} from 'react-native';
import { theme } from '../theme';

const EMERGENCY_CONTACTS = [
    { label: 'Servicio de Emergencias', number: '911', id: 'EMS' },
    { label: 'Neurólogo de Guardia', number: '+54 9 11 0000-0000', id: 'DR' },
    { label: 'Contacto de Confianza', number: '+54 9 11 0000-0001', id: 'SOS_CONTACT' },
];

export default function SOSScreen({ navigation }: any) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.4)).current;
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseAnim, {
                        toValue: 1.4,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0.4,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const handleSOSPress = () => {
        Alert.alert(
            'PROTOCOLO DE EMERGENCIA',
            '¿Desea iniciar llamada inmediata al 911 y compartir su ubicación?',
            [
                { text: 'CANCELAR', style: 'cancel' },
                {
                    text: 'ACTIVAR LLAMADA',
                    style: 'destructive',
                    onPress: () => {
                        setActivated(true);
                        Linking.openURL('tel:911');
                    }
                },
            ]
        );
    };

    const handleCallContact = (number: string, label: string) => {
        Alert.alert(
            'CONTACTAR',
            `¿Confirmar llamada directa a ${label}?`,
            [
                { text: 'VOLVER', style: 'cancel' },
                { text: 'LLAMAR', onPress: () => Linking.openURL(`tel:${number}`) },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HEADER TÉCNICO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Text style={styles.closeText}>CANCELAR</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SISTEMA SOS</Text>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.alertHeader}>
                    <View style={styles.liveDot} />
                    <Text style={styles.alertMainText}>CENTRO DE ACCIÓN RÁPIDA</Text>
                </View>

                {/* BOTÓN SOS PREMIUN */}
                <View style={styles.sosContainer}>
                    <Animated.View style={[
                        styles.pulseRing,
                        {
                            transform: [{ scale: pulseAnim }],
                            opacity: pulseOpacity,
                        }
                    ]} />
                    <TouchableOpacity
                        style={[styles.sosButton, activated && styles.sosButtonActive]}
                        onPress={handleSOSPress}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.sosLabel}>SOS</Text>
                        <View style={styles.divider} />
                        <Text style={styles.sosAction}>ACTIVAR</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.instruction}>
                    {activated ? 'COMUNICACIÓN INICIADA' : 'Presione el centro para asistencia inmediata'}
                </Text>

                {/* CONTACTOS ESTRUCTURADOS */}
                <View style={styles.contactsSection}>
                    <Text style={styles.sectionTitle}>CONTACTOS PRIORITARIOS</Text>
                    {EMERGENCY_CONTACTS.map((c, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.contactCard}
                            onPress={() => handleCallContact(c.number, c.label)}
                        >
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>{c.label.toUpperCase()}</Text>
                                <Text style={styles.contactNumber}>{c.number}</Text>
                            </View>
                            <View style={styles.callIconBox}>
                                <Text style={styles.callIcon}>→</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FOOTER DE PRIVACIDAD / SEGURIDAD */}
                <View style={styles.legalBox}>
                    <Text style={styles.legalText}>
                        <Text style={{ fontWeight: '800', color: '#fff' }}>AVISO:</Text> Al activar el SOS, sus últimas 4 horas de telemetría biométrica y su ubicación GPS se encriptan y se ponen a disposición de los servicios médicos vinculados.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' }, // Fondo Dark Navy para contraste máximo con el Rojo
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 20,
    },
    closeBtn: { paddingVertical: 8 },
    closeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 },
    headerTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 3 },

    content: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, paddingBottom: 60 },

    alertHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30,
        marginBottom: 60,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    alertMainText: { fontSize: 10, fontWeight: '900', color: '#FCA5A5', letterSpacing: 2 },

    sosContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    pulseRing: {
        position: 'absolute', width: 240, height: 240, borderRadius: 120,
        backgroundColor: '#EF4444',
    },
    sosButton: {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#EF4444',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#EF4444', shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
        borderWidth: 6, borderColor: 'rgba(255,255,255,0.2)',
    },
    sosButtonActive: { backgroundColor: '#B91C1C' },
    sosLabel: { fontSize: 50, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
    divider: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 8 },
    sosAction: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 4 },

    instruction: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: 60 },

    contactsSection: { width: '100%', marginBottom: 40 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 20 },
    contactCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
        padding: 20, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    contactInfo: { gap: 4 },
    contactLabel: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
    contactNumber: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
    callIconBox: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    callIcon: { color: '#FFF', fontSize: 18, fontWeight: '700' },

    legalBox: {
        backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    legalText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
