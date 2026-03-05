import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    View,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface BaseButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    textStyle?: TextStyle;
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

interface PrimaryButtonProps extends BaseButtonProps {
    variant?: 'default' | 'danger' | 'success';
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED TOUCHABLE wrapper — aplica scale en press
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const useButtonAnimation = () => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(theme.motion.scale.press, theme.motion.spring.snappy);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, theme.motion.spring.bouncy);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return { handlePressIn, handlePressOut, animatedStyle };
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY BUTTON
// ─────────────────────────────────────────────────────────────────────────────
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    label,
    onPress,
    disabled = false,
    loading = false,
    fullWidth = true,
    size = 'md',
    variant = 'default',
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
}) => {
    const { handlePressIn, handlePressOut, animatedStyle } = useButtonAnimation();

    const buttonColor = {
        default: theme.colors.primary,
        danger: theme.colors.riskHigh,
        success: theme.colors.riskLow,
    }[variant];

    const height = {
        sm: theme.sizes.buttonHeightSm,
        md: theme.sizes.buttonHeight,
        lg: theme.sizes.buttonHeightLg,
    }[size];

    return (
        <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? label}
                accessibilityHint={accessibilityHint}
                accessibilityState={{ disabled: disabled || loading, busy: loading }}
                style={[
                    styles.primaryBase,
                    { backgroundColor: buttonColor, height, minHeight: height },
                    disabled && styles.disabled,
                    style,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={'#FFFFFF'} size="small" />
                ) : (
                    <Text style={[styles.primaryLabel, textStyle]}>{label}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// GHOST BUTTON
// ─────────────────────────────────────────────────────────────────────────────
interface GhostButtonProps extends BaseButtonProps {
    borderColor?: string;
    labelColor?: string;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
    label,
    onPress,
    disabled = false,
    loading = false,
    fullWidth = true,
    size = 'md',
    borderColor,
    labelColor,
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
}) => {
    const { handlePressIn, handlePressOut, animatedStyle } = useButtonAnimation();

    const resolvedBorder = borderColor ?? theme.colors.primary;
    const resolvedLabel = labelColor ?? theme.colors.primary;

    const height = {
        sm: theme.sizes.buttonHeightSm,
        md: theme.sizes.buttonHeight,
        lg: theme.sizes.buttonHeightLg,
    }[size];

    return (
        <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? label}
                accessibilityHint={accessibilityHint}
                accessibilityState={{ disabled: disabled || loading }}
                style={[
                    styles.ghostBase,
                    { borderColor: resolvedBorder, height, minHeight: height },
                    disabled && styles.disabled,
                    style,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={resolvedLabel} size="small" />
                ) : (
                    <Text style={[styles.ghostLabel, { color: resolvedLabel }, textStyle]}>
                        {label}
                    </Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXT BUTTON (link-style)
// ─────────────────────────────────────────────────────────────────────────────
interface TextButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    color?: string;
    size?: 'sm' | 'md';
    style?: ViewStyle;
    accessibilityLabel?: string;
}

export const TextButton: React.FC<TextButtonProps> = ({
    label,
    onPress,
    disabled = false,
    color,
    size = 'md',
    style,
    accessibilityLabel,
}) => {
    const { handlePressIn, handlePressOut, animatedStyle } = useButtonAnimation();
    const resolvedColor = color ?? theme.colors.primary;
    const fontSize = size === 'sm' ? theme.typography.sizes.small : theme.typography.sizes.body;

    return (
        <Animated.View style={[animatedStyle, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? label}
                style={styles.textBase}
            >
                <Text style={[styles.textLabel, { color: resolvedColor, fontSize }]}>
                    {label}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ICON BUTTON (circular)
// ─────────────────────────────────────────────────────────────────────────────
interface IconButtonProps {
    icon: React.ReactNode;
    onPress: () => void;
    backgroundColor?: string;
    size?: number;
    style?: ViewStyle;
    accessibilityLabel: string;
    accessibilityHint?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onPress,
    backgroundColor,
    size = theme.sizes.touchTarget,
    style,
    accessibilityLabel,
    accessibilityHint,
}) => {
    const { handlePressIn, handlePressOut, animatedStyle } = useButtonAnimation();
    const bg = backgroundColor ?? 'rgba(79, 70, 229, 0.1)';

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                style={[
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    style,
                ]}
            >
                {icon}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    fullWidth: {
        width: '100%',
    },
    primaryBase: {
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryLabel: {
        color: '#FFFFFF',
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.semibold as any,
        letterSpacing: 0.2,
    },
    ghostBase: {
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.lg,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    ghostLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.medium as any,
        letterSpacing: 0.2,
    },
    textBase: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
        minHeight: theme.sizes.touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textLabel: {
        fontWeight: theme.typography.weights.medium as any,
    },
    disabled: {
        opacity: 0.4,
    },
});
