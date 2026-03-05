import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { theme, scoreToRiskLevel } from '../../theme';
import type { RiskLevel } from '../../theme';

interface RiskOrbProps {
    riskLevel?: RiskLevel;
    score?: number;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
    style?: ViewStyle;
}

const ORB_SIZES = {
    sm: 60,
    md: 110,
    lg: 180,
} as const;

export const RiskOrb: React.FC<RiskOrbProps> = ({
    riskLevel,
    score = 0,
    size = 'lg',
    animated = true,
    style,
}) => {
    const level: RiskLevel = riskLevel ?? scoreToRiskLevel(score);
    const orbSize = ORB_SIZES[size];

    // Colores dinámicos basados en el riesgo
    const getColors = () => {
        if (level === 'high') return { primary: theme.colors.riskHigh, secondary: theme.colors.secondary };
        if (level === 'medium') return { primary: theme.colors.riskMedium, secondary: theme.colors.secondary };
        return { primary: theme.colors.riskLow, secondary: theme.colors.secondary };
    };

    const colors = getColors();

    // Animaciones
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (!animated) return;

        rotation.value = withRepeat(
            withTiming(360, { duration: 15000, easing: Easing.linear }),
            -1,
            false
        );

        if (level === 'high') {
            pulse.value = withRepeat(
                withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            pulse.value = withSpring(1);
        }
    }, [level, animated]);

    const animatedScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: level === 'high' ? pulse.value : scale.value }],
    }));

    const rotationStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <View style={[styles.container, { width: orbSize, height: orbSize }, style]}>

            {/* ESCUDO VIOLETA (El halo del logo) */}
            <View style={[StyleSheet.absoluteFill, styles.center]}>
                <Svg width={orbSize * 1.5} height={orbSize * 1.5} viewBox="0 0 100 100">
                    <Defs>
                        <LinearGradient id="shieldGradOrb" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor={theme.colors.secondary} stopOpacity="0.4" />
                            <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <Path
                        d="M50 10 L85 35 L85 65 L50 90 L15 65 L15 35 Z"
                        fill="url(#shieldGradOrb)"
                    />
                </Svg>
            </View>

            {/* ANILLO GIRATORIO */}
            <Animated.View style={[StyleSheet.absoluteFill, rotationStyle, styles.center]}>
                <Svg width={orbSize} height={orbSize} viewBox="0 0 100 100">
                    <Circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="2"
                        strokeDasharray="15 10"
                        strokeOpacity="0.5"
                    />
                </Svg>
            </Animated.View>

            {/* CORE DEL RIESGO */}
            <Animated.View style={[animatedScaleStyle, styles.center]}>
                <Svg width={orbSize * 0.7} height={orbSize * 0.7} viewBox="0 0 100 100">
                    <Defs>
                        <LinearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={colors.primary} />
                            <Stop offset="100%" stopColor={colors.secondary} />
                        </LinearGradient>
                    </Defs>
                    <Circle cx="50" cy="50" r="45" fill="url(#coreGrad)" />
                    <Circle cx="50" cy="50" r="5" fill="white" fillOpacity="0.8" />
                </Svg>
            </Animated.View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RiskOrb;
