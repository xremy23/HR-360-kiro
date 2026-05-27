/**
 * Design System - Centralized styling constants
 * Colors, typography, spacing, and shadows
 */

// Colors
export const colors = {
  primary: {
    teal: '#038F8D',
    white: '#FFFFFF',
    black: '#000000',
  },
  secondary: {
    darkTeal: '#024F45',
    mediumTeal: '#017473',
    lightTeal: '#9AC0C3',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Typography
export const typography = {
  fontFamily: {
    display: 'Funnel Display', // Serif
    sans: 'Funnel Sans', // Sans-serif
    body: 'DM Sans', // Sans-serif
  },
  fontSize: {
    display1: {
      size: 48,
      weight: '700' as const,
      lineHeight: 56,
    },
    display2: {
      size: 40,
      weight: '700' as const,
      lineHeight: 48,
    },
    display3: {
      size: 32,
      weight: '700' as const,
      lineHeight: 40,
    },
    h1: {
      size: 28,
      weight: '700' as const,
      lineHeight: 36,
    },
    h2: {
      size: 24,
      weight: '700' as const,
      lineHeight: 32,
    },
    h3: {
      size: 20,
      weight: '700' as const,
      lineHeight: 28,
    },
    label1: {
      size: 16,
      weight: '600' as const,
      lineHeight: 24,
    },
    label2: {
      size: 14,
      weight: '600' as const,
      lineHeight: 20,
    },
    body1: {
      size: 16,
      weight: '400' as const,
      lineHeight: 24,
    },
    body2: {
      size: 14,
      weight: '400' as const,
      lineHeight: 20,
    },
    body3: {
      size: 12,
      weight: '400' as const,
      lineHeight: 18,
    },
  },
};

// Spacing (4px base unit)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const shadows = {
  xs: {
    shadowColor: colors.primary.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.primary.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.primary.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.primary.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.primary.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Responsive breakpoints (for web/tablet)
export const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

// Z-index scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
};
