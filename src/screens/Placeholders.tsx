import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#94A3B8',
        fontSize: 16,
    },
});

export const HistoryScreen = () => (
    <View style={styles.container}><Text style={styles.text}>History Screen (Coming Soon)</Text></View>
);

export const InsightsScreen = () => (
    <View style={styles.container}><Text style={styles.text}>Insights Screen (Coming Soon)</Text></View>
);

export const CommunityScreen = () => (
    <View style={styles.container}><Text style={styles.text}>Community Screen (Coming Soon)</Text></View>
);

export const ProfileScreen = () => (
    <View style={styles.container}><Text style={styles.text}>Profile Screen (Coming Soon)</Text></View>
);
