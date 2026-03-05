/**
 * EpiMigrApp — Design System v2.2 (FULL SYNC)
 * Basado en el Isologotipo oficial: "Neural Shield & Wave"
 */

const palette = {
    // Colores del logo
    brandNavy: '#0B1121',  // Wordmark "EPIMIGRAPP"
    brandIndigo: '#4F46E5',  // Wave Start
    brandViolet: '#8B5CF6',  // Protective Shield / Peak
    brandTeal: '#10B981',  // Stable End

    // Variantes Light (para backgrounds de alerts/cards)
    indigo50: '#EEF2FF',
    violet50: '#F5F3FF',
    teal50: '#ECFDF5',
    amber50: '#FFFBEB',
    rose50: '#FFF1F2',

    // Grises y neutrales
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
} as const;

export const theme = {
    colors: {
        background: palette.slate50,
        backgroundAlt: palette.slate100,
        surface: palette.white,
        surfaceElevated: palette.white,

        // Brand logic
        primary: palette.brandIndigo,
        primaryLight: palette.indigo50,
        secondary: palette.brandViolet,
        secondaryLight: palette.violet50,
        accent: palette.brandTeal,
        accentLight: palette.teal50,
        navy: palette.brandNavy,

        // Semáforo y Status (Sincronizado con app expectations)
        riskLow: palette.brandTeal,
        riskLowBg: palette.teal50,
        riskMedium: '#D97706',
        riskMediumBg: palette.amber50,
        riskHigh: '#E11D48',
        riskHighBg: palette.rose50,

        success: palette.brandTeal,
        successLight: palette.teal50,
        warning: '#D97706',
        warningLight: palette.amber50,
        danger: '#E11D48',
        dangerLight: palette.rose50,

        // Texto
        textPrimary: palette.brandNavy,
        textSecondary: palette.slate600,
        textMuted: palette.slate400,
        textInverse: palette.white,

        border: palette.slate200,
        borderLight: palette.slate100,
    },

    typography: {
        fonts: {
            ui: 'Montserrat_500Medium',
            uiBold: 'Montserrat_700Bold',
            data: 'JetBrainsMono_400Regular',
        },
        sizes: {
            display: 32,
            h1: 24,
            h2: 20,
            h3: 17,
            body: 15,
            small: 13,
            caption: 11,
            dataLg: 40,
            dataMd: 24,
            dataSm: 16,
        },
        weights: {
            regular: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        }
    },

    spacing: {
        xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
    },

    radius: {
        xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999
    },

    shadow: {
        sm: {
            shadowColor: palette.brandNavy,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
        },
        md: {
            shadowColor: palette.brandNavy,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 4,
        },
    },

    motion: {
        duration: { fast: 150, normal: 300, slow: 800 },
        spring: {
            default: { damping: 15, stiffness: 150, mass: 1 },
            bouncy: { damping: 10, stiffness: 180, mass: 1 },
            gentle: { damping: 20, stiffness: 120, mass: 1 },
            snappy: { damping: 20, stiffness: 300, mass: 0.8 },
        },
        scale: {
            press: 0.96,
            hover: 1.02,
            bounce: 1.05,
            riskOrb: 1.1,
        }
    },

    sizes: {
        touchTarget: 44,
        buttonHeight: 52,
        buttonHeightSm: 40,
        buttonHeightLg: 60,
    }
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Helpers para el sistema de riesgo
 */
export const getRiskColors = (level: RiskLevel) => {
    switch (level) {
        case 'high': return { primary: theme.colors.riskHigh, background: theme.colors.riskHighBg };
        case 'medium': return { primary: theme.colors.riskMedium, background: theme.colors.riskMediumBg };
        default: return { primary: theme.colors.riskLow, background: theme.colors.riskLowBg };
    }
};

export const scoreToRiskLevel = (score: number): RiskLevel => {
    if (score < 0.40) return 'low';
    if (score < 0.70) return 'medium';
    return 'high';
};

export const backendRiskToLevel = (risk: string): RiskLevel => {
    switch (risk?.toUpperCase()) {
        case 'HIGH': return 'high';
        case 'MEDIUM': return 'medium';
        case 'LOW': return 'low';
        default: return 'low';
    }
};

export default theme;
