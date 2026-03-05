import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { theme } from '../../theme';

/**
 * LiveSignalStrip — Indicador visual de monitoreo activo
 */

export const LiveSignalStrip = () => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.dot, animatedStyle]} />
            <Text style={styles.text}>MONITOREO BIOMÉTRICO ACTIVO</Text>
            <View style={styles.waveContainer}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[styles.waveLine, { height: 4 + (i * 2) }]} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Teal muy suave
        borderRadius: 20,
        alignSelf: 'center',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.accent,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.accent,
        letterSpacing: 1,
    },
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    waveLine: {
        width: 2,
        backgroundColor: theme.colors.accent,
        borderRadius: 1,
        opacity: 0.5,
    },
});
