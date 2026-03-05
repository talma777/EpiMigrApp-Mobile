import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { Logo } from '../components';

type FieldError = { email?: string; password?: string; general?: string };

export default function LoginScreen({ navigation }: any) {
    const { signIn } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldError>({});
    const [focusField, setFocusField] = useState<string | null>(null);

    const validate = (): boolean => {
        const e: FieldError = {};
        if (!email.trim()) e.email = 'El correo es requerido';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo inválido';
        if (!password) e.password = 'La contraseña es requerida';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        setErrors({});
        try {
            await signIn({ email: email.trim(), password });
        } catch (error: any) {
            setErrors({ general: 'Error de autenticación. Verificá tus credenciales.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* Logo centrado */}
                    <View style={styles.header}>
                        <Logo size="lg" showClaim={true} />
                    </View>

                    <Text style={styles.subtitle}>Accedé a tu ecosistema de monitoreo neurológico.</Text>

                    {/* Alert Banner para errores generales */}
                    {errors.general && (
                        <View style={styles.errorBanner}>
                            <View style={styles.errorIndicator} />
                            <Text style={styles.errorBannerText}>{errors.general}</Text>
                        </View>
                    )}

                    {/* Formulario Clínico */}
                    <View style={styles.form}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    focusField === 'email' && styles.inputFocus,
                                    errors.email && styles.inputError
                                ]}
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
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>CONTRASEÑA</Text>
                                <TouchableOpacity onPress={() => Alert.alert(
                                    'Recuperar contraseña',
                                    'Te enviaremos un correo con instrucciones para restablecer tu contraseña.',
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { text: 'Enviar', onPress: () => {
                                            if (!email.trim()) {
                                                setErrors({ email: 'Ingresá tu correo primero' });
                                            } else {
                                                Alert.alert('Correo enviado', `Se envió un enlace de recuperación a ${email.trim()}.`);
                                            }
                                        }}
                                    ]
                                )}>
                                    <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    focusField === 'password' && styles.inputFocus,
                                    errors.password && styles.inputError
                                ]}
                                placeholder="••••••••••••"
                                placeholderTextColor={theme.colors.textMuted}
                                value={password}
                                onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })); }}
                                secureTextEntry
                                onFocus={() => setFocusField('password')}
                                onBlur={() => setFocusField(null)}
                            />
                            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.loginBtnText}>INGRESAR</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>¿No tenés cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Registrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40 },

    header: { alignItems: 'center', marginBottom: 24 },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 32 },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.riskHighBg,
        borderRadius: 12, padding: 16, marginBottom: 24,
    },
    errorIndicator: { width: 4, height: 24, borderRadius: 2, backgroundColor: theme.colors.danger },
    errorBannerText: { flex: 1, color: theme.colors.danger, fontSize: 13, fontWeight: '600' },

    form: { gap: 20 },
    fieldGroup: { gap: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8 },
    forgotText: { fontSize: 11, color: theme.colors.primary, fontWeight: '600' },

    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5, borderColor: '#E2E8F0',
        borderRadius: 12, padding: 16,
        fontSize: 15, color: theme.colors.navy,
    },
    inputFocus: { borderColor: theme.colors.primary, backgroundColor: '#FFFFFF' },
    inputError: { borderColor: theme.colors.danger },
    fieldError: { fontSize: 11, color: theme.colors.danger, marginTop: 2, fontWeight: '600' },

    loginBtn: {
        backgroundColor: theme.colors.navy,
        paddingVertical: 18, borderRadius: 16,
        alignItems: 'center', marginTop: 12,
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    registerText: { color: theme.colors.textSecondary, fontSize: 13 },
    registerLink: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
});
