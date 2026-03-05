import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RiskBannerProps {
    level: string;
}

export const RiskBanner: React.FC<RiskBannerProps> = ({ level }) => {
    if (level !== 'HIGH') return null;

    return (
        <View style={styles.container}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={styles.text}>Riesgo ALTO detectado</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    text: {
        color: '#991B1B',
        fontWeight: '700',
        fontSize: 14,
    },
});
