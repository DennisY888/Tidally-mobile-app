// constants/Colors.ts
export const Colors = {
  light: {
    text: '#1A2B3D', // Deep slate blue
    textSecondary: '#536B88', // Medium slate blue
    textTertiary: '#8096B0', // Light slate blue
    background: '#FFFFFF', // Pure white
    backgroundSecondary: '#F7FAFD', // Slightly blue-tinted background
    tint: '#2E5C8A', // Deep ocean blue
    primary: '#2E5C8A', // Deep ocean blue
    primaryDark: '#1D4875', // Darker ocean blue for pressed states
    primaryLight: '#E9F0F8', // Very light blue for backgrounds
    secondary: '#88B6E0', // Soft sky blue
    secondaryDark: '#5C98CE', // Darker sky blue for pressed states
    accent: '#64D2FF', // Bright cyan for highlights
    success: '#2ECB8E', // Mint green
    warning: '#FFB547', // Amber
    error: '#F87272', // Coral red
    lightGray: '#F6F9FC', // Ice blue
    divider: '#E5EDF5', // Light divider color
    shadow: 'rgba(37, 99, 235, 0.08)', // Subtle blue shadow
  },
  dark: {
    text: '#E5EDF5', // Soft white with blue tint
    textSecondary: '#A0B4CB', // Medium gray-blue
    textTertiary: '#6B839E', // Darker gray-blue
    background: '#0A1829', // Deep ocean night
    backgroundSecondary: '#112436', // Slightly lighter background
    tint: '#64A1D6', // Bright ocean blue
    primary: '#64A1D6', // Bright ocean blue
    primaryDark: '#4A87BC', // Darker ocean blue for pressed states
    primaryLight: '#1C2E47', // Dark blue with slight transparency
    secondary: '#3D718F', // Muted ocean blue
    secondaryDark: '#2A5A78', // Darker muted blue for pressed states
    accent: '#4AADDA', // Deeper cyan for highlights
    success: '#26A676', // Darker mint green
    warning: '#DB9A3E', // Darker amber
    error: '#D65F5F', // Darker coral red
    lightGray: '#1C2B3A', // Dark slate
    divider: '#2A3D53', // Dark divider color
    shadow: 'rgba(9, 30, 66, 0.35)', // Deep ocean shadow
  },
};

// Typography scale
export const Typography = {
  largeTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 34,
    lineHeight: 41,
  },
  title1: {
    fontFamily: 'outfit-bold',
    fontSize: 28,
    lineHeight: 34,
  },
  title2: {
    fontFamily: 'outfit-bold',
    fontSize: 22,
    lineHeight: 28,
  },
  title3: {
    fontFamily: 'outfit-medium',
    fontSize: 20,
    lineHeight: 25,
  },
  headline: {
    fontFamily: 'outfit-medium',
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'outfit',
    fontSize: 17,
    lineHeight: 22,
  },
  callout: {
    fontFamily: 'outfit',
    fontSize: 16,
    lineHeight: 21,
  },
  subhead: {
    fontFamily: 'outfit',
    fontSize: 15,
    lineHeight: 20,
  },
  footnote: {
    fontFamily: 'outfit',
    fontSize: 13,
    lineHeight: 18,
  },
  caption1: {
    fontFamily: 'outfit',
    fontSize: 12,
    lineHeight: 16,
  },
  caption2: {
    fontFamily: 'outfit',
    fontSize: 11,
    lineHeight: 13,
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};