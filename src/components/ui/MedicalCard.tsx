import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

/**
 * MedicalCard — Contenedor premium para datos estructurados.
 * Proporciona un radio de borde consistente y elevación suave.
 */

interface MedicalCardProps {
    children: React.ReactNode;
    title?: string;
    elevation?: 'sm' | 'md' | 'none';
    style?: ViewStyle;
}

export const MedicalCard: React.FC<MedicalCardProps> = ({
    children, title, elevation = 'sm', style
}) => {
    return (
        <View style={[
            styles.card,
            elevation !== 'none' && theme.shadow[elevation],
            style
        ]}>
            {title && <Text style={styles.cardTitle}>{title.toUpperCase()}</Text>}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 1.2,
        marginBottom: 16,
    },
});
