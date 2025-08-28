/**
 * Theme configuration for B&B Inventory Management
 * Contains brand colors, theme settings, and utility functions
 */

export const brandColors = {
  primary: '#D10D38',        // B&B Red
  primaryReverse: '#153275',  // B&B Blue
  accent1: '#0374EF',        // Blue accent
  accent2: '#886DE8',        // Purple accent
  accent3: '#F7C959',        // Yellow accent
  accent4: '#EF7037',        // Orange accent
  black: '#000000',
  gray: '#898989',
  light: '#FBFBFB',
} as const;

export const themeConfig = {
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
  attribute: 'class' as const,
  storageKey: 'bb-inventory-theme',
};

export const darkModeColors = {
  background: '#0F172A',
  foreground: '#F8FAFC',
  card: '#1E293B',
  cardForeground: '#F8FAFC',
  popover: '#1E293B',
  popoverForeground: '#F8FAFC',
  primary: '#E11D48',
  primaryForeground: '#FFFFFF',
  secondary: '#64748B',
  secondaryForeground: '#F8FAFC',
  muted: '#334155',
  mutedForeground: '#94A3B8',
  accent: '#3B82F6',
  accentForeground: '#FFFFFF',
  destructive: '#E11D48',
  destructiveForeground: '#FFFFFF',
  border: '#475569',
  input: '#334155',
  ring: '#E11D48',
} as const;

export const lightModeColors = {
  background: 'linear-gradient(135deg, #FBFBFB 0%, #FFFFFF 100%)',
  foreground: '#153275',
  card: '#FFFFFF',
  cardForeground: '#153275',
  popover: '#FFFFFF',
  popoverForeground: '#153275',
  primary: '#D10D38',
  primaryForeground: '#FFFFFF',
  secondary: '#153275',
  secondaryForeground: '#FFFFFF',
  muted: '#F7F7F7',
  mutedForeground: '#898989',
  accent: '#0374EF',
  accentForeground: '#FFFFFF',
  destructive: '#D10D38',
  destructiveForeground: '#FFFFFF',
  border: '#E5E7EB',
  input: '#F9FAFB',
  ring: '#D10D38',
} as const;

/**
 * Utility function to get theme-aware colors
 */
export const getThemeColor = (theme: 'light' | 'dark', colorKey: keyof typeof lightModeColors) => {
  return theme === 'dark' ? darkModeColors[colorKey] : lightModeColors[colorKey];
};

/**
 * Theme transition configuration
 */
export const themeTransitions = {
  duration: '300ms',
  easing: 'ease',
  properties: ['background-color', 'border-color', 'color', 'fill', 'stroke', 'opacity'],
} as const;
