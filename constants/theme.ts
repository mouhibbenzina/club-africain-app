export const Colors = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#252525',
  primary: '#CC0000',
  primaryDark: '#990000',
  primaryLight: '#FF1A1A',
  gold: '#F5A623',
  green: '#27AE60',
  greenDark: '#1E8449',
  blue: '#3498DB',
  purple: '#9B59B6',
  orange: '#E67E22',
  red: '#E74C3C',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  tabInactive: '#555555',
  border: '#2A2A2A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  gradientStart: '#CC0000',
  gradientEnd: '#8B0000',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 6,
  card: 12,
  cardLg: 16,
  btn: 8,
  pill: 20,
  full: 999,
} as const;

export const FontSize = {
  caption: 11,
  label: 12,
  body: 14,
  subtitle: 16,
  title: 18,
  heading: 20,
  display: 24,
  hero: 32,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

export const SportColors: Record<string, string> = {
  football: '#CC0000',
  handball: '#E67E22',
  basketball: '#3498DB',
  volleyball: '#9B59B6',
  boxing: '#27AE60',
} as const;
