import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

/**
 * DataChip — Bloque de métrica biométrica
 * 
 * Usado para: HR, EDA, SpO2, etc. en el Dashboard.
 */

interface DataChipProps {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
    style?: ViewStyle;
}

export const DataChip: React.FC<DataChipProps> = ({
    label, value, unit, trend, color, style
}) => {
    const resolvedColor = color || theme.colors.navy;

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label.toUpperCase()}</Text>
            <View style={styles.valueRow}>
                <Text style={[styles.value, { color: resolvedColor }]}>{value}</Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
            {trend && (
                <View style={styles.trendRow}>
                    <Text style={[styles.trendIcon, { color: trend === 'down' ? theme.colors.riskLow : theme.colors.riskHigh }]}>
                        {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'}
                    </Text>
                    <Text style={styles.trendLabel}>{trend === 'stable' ? 'ESTABLE' : 'TENDENCIA'}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 100,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontSize: 20,
        fontWeight: '800',
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.textMuted,
        marginLeft: 2,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    trendIcon: { fontSize: 10 },
    trendLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
    },
});
