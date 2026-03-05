import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusChipProps {
    label: string;
    type?: 'success' | 'warning' | 'error' | 'info';
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, type = 'info' }) => {
    const getStyles = () => {
        switch (type) {
            case 'success': return { bg: '#D1FAE5', text: '#059669' };
            case 'warning': return { bg: '#FEF3C7', text: '#D97706' };
            case 'error': return { bg: '#FEE2E2', text: '#DC2626' };
            default: return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const styleSet = getStyles();

    return (
        <View style={[styles.pill, { backgroundColor: styleSet.bg }]}>
            <Text style={[styles.text, { color: styleSet.text }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
    },
    text: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});
