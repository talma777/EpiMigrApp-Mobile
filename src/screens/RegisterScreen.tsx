import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { Logo } from '../components';

type FieldError = { email?: string; password?: string; confirm?: string; general?: string };

export default function RegisterScreen({ navigation }: any) {
    const { signUp } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldError>({});
    const [focusField, setFocusField] = useState<string | null>(null);

    const validate = (): boolean => {
        const e: FieldError = {};
        if (!email.trim()) e.email = 'El correo es requerido';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo inválido';
        if (!password) e.password = 'La contraseña es requerida';
        else if (password.length < 6) e.password = 'Mínimo 6 caracteres por seguridad clínica';
        if (!confirmPassword) e.confirm = 'Confirme su contraseña';
        else if (password !== confirmPassword) e.confirm = 'Las contraseñas no coinciden';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        setErrors({});
        try {
            await signUp({ email: email.trim(), password, role: 'PATIENT' });
        } catch (error: any) {
            const errStr = String(error?.message || error);
            if (errStr.includes("Network") || errStr.includes("Failed to fetch") || errStr.includes("JSON")) {
                setErrors({ general: 'Error de Red: No se pudo conectar con el servidor central. Revise su conexión Wi-Fi.' });
            } else if (errStr.toLowerCase().includes('exist') || errStr.toLowerCase().includes('already')) {
                setErrors({ general: 'Este correo ya dispone de una ficha clínica activa.' });
            } else {
                setErrors({ general: `Error en el sistema de alta: ${errStr}` });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    <View style={styles.header}>
                        <Logo size="md" showClaim={false} />
                        <Text style={styles.title}>Alta de Paciente</Text>
                        <Text style={styles.subtitle}>Cree su perfil centralizado para comenzar el monitoreo.</Text>
                    </View>

                    {errors.general && (
                        <View style={styles.errorBanner}>
                            <View style={styles.errorIndicator} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.errorBannerText}>{errors.general}</Text>
                                {errors.general.includes('activa') && (
                                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                        <Text style={styles.errorBannerLink}>Ir al Panel de Acceso →</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={styles.form}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                            <TextInput
                                style={[styles.input, focusField === 'email' && styles.inputFocus, errors.email && styles.inputError]}
                                placeholder="usuario@clinica.com"
                                placeholderTextColor={theme.colors.textMuted}
                                value={email}
                                onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: undefined })); }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setFocusField('email')}
                                onBlur={() => setFocusField(null)}
                            />
                            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>CONTRASEÑA</Text>
                            <TextInput
                                style={[styles.input, focusField === 'password' && styles.inputFocus, errors.password && styles.inputError]}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={theme.colors.textMuted}
                                value={password}
                                onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })); }}
                                secureTextEntry
                                onFocus={() => setFocusField('password')}
                                onBlur={() => setFocusField(null)}
                            />
                            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>CONFIRMAR CREDENCIAL</Text>
                            <TextInput
                                style={[styles.input, focusField === 'confirm' && styles.inputFocus, errors.confirm && styles.inputError]}
                                placeholder="Repita la contraseña"
                                placeholderTextColor={theme.colors.textMuted}
                                value={confirmPassword}
                                onChangeText={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirm: undefined })); }}
                                secureTextEntry
                                onFocus={() => setFocusField('confirm')}
                                onBlur={() => setFocusField(null)}
                            />
                            {errors.confirm && <Text style={styles.fieldError}>{errors.confirm}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.registerBtn, loading && styles.btnDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.registerBtnText}>FINALIZAR ALTA</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>¿Ya dispone de una ficha clínica? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Acceder</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.disclaimer}>
                            Sus datos sensibles están encriptados y protegidos bajo marcos regulatorios internacionales de salud.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40 },

    header: { marginBottom: 32, marginLeft: -10 },
    title: { fontSize: 24, fontWeight: '800', color: theme.colors.navy, marginTop: 20, marginBottom: 8 },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },

    errorBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: theme.colors.riskHighBg,
        borderRadius: 12, padding: 16, marginBottom: 24,
    },
    errorIndicator: { width: 4, height: 32, borderRadius: 2, backgroundColor: theme.colors.danger },
    errorBannerText: { color: theme.colors.danger, fontSize: 13, fontWeight: '600' },
    errorBannerLink: { color: theme.colors.primary, fontSize: 12, fontWeight: '700', marginTop: 6 },

    form: { gap: 16 },
    fieldGroup: { gap: 6 },
    label: { fontSize: 10, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8 },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5, borderColor: '#E2E8F0',
        borderRadius: 12, padding: 16,
        fontSize: 15, color: theme.colors.navy,
    },
    inputFocus: { borderColor: theme.colors.primary, backgroundColor: '#FFFFFF' },
    inputError: { borderColor: theme.colors.danger },
    fieldError: { fontSize: 11, color: theme.colors.danger, marginTop: 2, fontWeight: '600' },

    registerBtn: {
        backgroundColor: theme.colors.navy,
        paddingVertical: 18, borderRadius: 16,
        alignItems: 'center', marginTop: 12,
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { opacity: 0.6 },
    registerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    loginText: { color: theme.colors.textSecondary, fontSize: 13 },
    loginLink: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },

    disclaimer: { textAlign: 'center', fontSize: 10, color: theme.colors.textMuted, lineHeight: 16, marginTop: 12 },
});
