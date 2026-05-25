/**
 * HR Crisis 360 - Design System
 * Centralized design tokens and theme configuration
 */

// Primary Colors
export const colors = {
  primary: {
    teal: '#038F8D',        // R:3, G:143, B:141
    white: '#FFFFFF',       // R:255, G:255, B:255
    black: '#000000',       // R:0, G:0, B:0
  },
  secondary: {
    darkTeal: '#024F45',    // R:2, G:79, B:69
    mediumTeal: '#017473',  // R:1, G:116, B:115
    lightTeal: '#9AC0C3',   // R:154, G:192, B:195
  },
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  // Neutral colors
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
};

// Typography
export const typography = {
  fontFamily: {
    primary: '"Funnel Display", serif',      // Primary heading font
    secondary: '"Funnel Sans", sans-serif',  // Secondary headings
    tertiary: '"DM Sans", sans-serif',       // Body text
  },
  fontSize: {
    // Display sizes
    display1: { size: '48px', weight: 700, lineHeight: '56px' },
    display2: { size: '40px', weight: 700, lineHeight: '48px' },
    display3: { size: '32px', weight: 700, lineHeight: '40px' },
    
    // Heading sizes
    h1: { size: '28px', weight: 700, lineHeight: '36px' },
    h2: { size: '24px', weight: 700, lineHeight: '32px' },
    h3: { size: '20px', weight: 600, lineHeight: '28px' },
    h4: { size: '18px', weight: 600, lineHeight: '26px' },
    h5: { size: '16px', weight: 600, lineHeight: '24px' },
    h6: { size: '14px', weight: 600, lineHeight: '20px' },
    
    // Body sizes
    body1: { size: '16px', weight: 400, lineHeight: '24px' },
    body2: { size: '14px', weight: 400, lineHeight: '20px' },
    body3: { size: '12px', weight: 400, lineHeight: '18px' },
    
    // Label sizes
    label1: { size: '14px', weight: 500, lineHeight: '20px' },
    label2: { size: '12px', weight: 500, lineHeight: '18px' },
    
    // Caption
    caption: { size: '11px', weight: 400, lineHeight: '16px' },
  },
};

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

// Border Radius
export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Theme object for easy access
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
};

export default theme;
