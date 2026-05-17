export const COLORS = {
  primary: '#3b82f6', // blue-500
  success: '#10b981', // emerald-500
  danger: '#f43f5e', // rose-500
  warning: '#f59e0b', // amber-500
  info: '#0ea5e9', // sky-500
  
  // Design Tokens
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Transparent colors for glass effects
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(15, 23, 42, 0.6)',
    border: {
      light: 'rgba(255, 255, 255, 0.3)',
      dark: 'rgba(255, 255, 255, 0.1)',
    }
  }
};

const tintColorLight = COLORS.primary;
const tintColorDark = '#fff';

export default {
  light: {
    text: COLORS.slate[900],
    textSecondary: COLORS.slate[500],
    background: COLORS.slate[50],
    tint: tintColorLight,
    tabIconDefault: COLORS.slate[400],
    tabIconSelected: tintColorLight,
    card: COLORS.glass.light,
    border: COLORS.slate[200],
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9', // slate.100
    overlay: 'rgba(0, 0, 0, 0.4)',
    iconBg: 'rgba(0, 0, 0, 0.05)',
    skeleton: '#e2e8f0', // slate.200
  },
  dark: {
    text: COLORS.slate[50],
    textSecondary: COLORS.slate[400],
    background: COLORS.slate[950],
    tint: tintColorDark,
    tabIconDefault: COLORS.slate[600],
    tabIconSelected: tintColorDark,
    card: COLORS.glass.dark,
    border: COLORS.slate[800],
    surface: 'rgba(30, 41, 59, 0.5)',
    surfaceSubtle: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    iconBg: 'rgba(255, 255, 255, 0.1)',
    skeleton: '#1e293b', // slate.800
  },
};

export type ThemeType = 'light' | 'dark';
