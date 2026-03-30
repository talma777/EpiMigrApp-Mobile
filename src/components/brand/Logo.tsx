import React from 'react';
import Svg, { Path, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

/**
 * EPIMIGRAPP — Isologotipo Oficial "Neural Shield & Wave"
 * 
 * Reconstrucción fiel de la imagen:
 * - Onda biométrica con gradiente tricolor (Indigo -> Violet -> Teal)
 * - Escudo/Halo central en Violeta difuminado
 * - Tipografía EPIMIGRAPP en Mayúsculas (Bold Navy)
 * - Claim: "Tu Copiloto Neurológico"
 */

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
    size?: LogoSize;
    showClaim?: boolean;
    colorMode?: 'light' | 'dark' | 'mono';
}

const SIZES = {
    sm: { height: 34, width: 160 },
    md: { height: 60, width: 250 },
    lg: { height: 100, width: 400 },
    xl: { height: 160, width: 600 },
};

export const Logo: React.FC<LogoProps> = ({
    size = 'md',
    showClaim = true,
    colorMode = 'light'
}) => {
    const dims = SIZES[size];
    const textColor = colorMode === 'mono' ? '#FFFFFF' : theme.colors.navy;

    return (
        <View style={[styles.container, { height: dims.height, width: dims.width }]}>
            <Svg
                viewBox="0 0 600 200"
                height="100%"
                width="100%"
                preserveAspectRatio="xMidYMid meet"
            >
                <Defs>
                    {/* Gradiente de la onda según el logo */}
                    <LinearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#4F46E5" />
                        <Stop offset="45%" stopColor="#8B5CF6" />
                        <Stop offset="100%" stopColor="#10B981" />
                    </LinearGradient>

                    {/* Gradiente del Escudo/Brillo central */}
                    <LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
                    </LinearGradient>
                </Defs>

                {/* SÍMBOLO: La Onda y el Escudo - Centrado verticalmente (y=100) y escalado para seguridad */}
                <G transform="translate(10, 100) scale(0.5)">
                    {/* El "Escudo" o Brillo detrás del pico */}
                    <Path
                        d="M60 40 L85 10 L110 40 L110 70 L85 95 L60 70 Z"
                        fill="url(#shieldGrad)"
                        transform="translate(25, -10)"
                    />

                    {/* La Onda Biométrica */}
                    <Path
                        d="M 5 65 Q 15 65 20 45 Q 25 30 30 65 Q 35 100 45 75 Q 55 50 65 65 Q 75 80 85 15 Q 95 -50 105 65 Q 115 150 125 65 Q 135 40 145 65 Q 165 90 200 65"
                        fill="none"
                        stroke="url(#waveGrad)"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                </G>

                {/* WORDMARK: EPIMIGRAPP */}
                <SvgText
                    x="150"
                    y="105"
                    fontSize="60"
                    fontWeight="900"
                    fontFamily="System"
                    fill={textColor}
                    letterSpacing="2"
                >
                    EPIMIGRAPP
                </SvgText>

                {/* CLAIM: Tu Copiloto Neurológico */}
                {showClaim && (
                    <SvgText
                        x="170"
                        y="145"
                        fontSize="26"
                        fontWeight="500"
                        fontFamily="System"
                        fill={textColor}
                        opacity="0.8"
                    >
                        Tu Copiloto Neurológico
                    </SvgText>
                )}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
});

export default Logo;
