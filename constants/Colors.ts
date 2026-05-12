// constants/Colors.ts

export const Colors = {
  light: {
    // UNCHANGED — light mode users unaffected
    text: '#1A2B3D',
    textSecondary: '#536B88',
    textTertiary: '#8096B0',
    background: '#FFFFFF',
    backgroundSecondary: '#F7FAFD',
    tint: '#2E5C8A',
    primary: '#2E5C8A',
    primaryDark: '#1D4875',
    primaryLight: '#E9F0F8',
    secondary: '#88B6E0',
    secondaryDark: '#5C98CE',
    accent: '#64D2FF',
    success: '#2ECB8E',
    warning: '#FFB547',
    error: '#F87272',
    lightGray: '#F6F9FC',
    divider: '#E5EDF5',
    shadow: 'rgba(37, 99, 235, 0.08)',
  },
  dark: {
    // PRIMARY TEXT — 100% white per design bible
    text: '#FFFFFF',
    // SECONDARY — white at 60% opacity
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    // TERTIARY — white at 35% opacity
    textTertiary: 'rgba(255, 255, 255, 0.35)',
    // BACKGROUNDS — deep ocean palette
    background: '#0A1525',          // elevated surface (cards, headers)
    backgroundSecondary: '#020B18', // base layer (screen backgrounds)
    // PRIMARY ACCENT — bioluminescent cyan (THE most important change)
    tint: '#00D9FF',
    primary: '#00D9FF',
    primaryDark: '#00AECF',         // slightly darker cyan for pressed states
    primaryLight: 'rgba(0, 217, 255, 0.08)', // very faint cyan tint for backgrounds
    // SECONDARY ACCENT — seafoam
    secondary: '#7FFFD4',
    secondaryDark: '#5ECFAA',
    // HIGHLIGHT — same cyan family
    accent: '#00D9FF',
    // SEMANTIC COLORS
    success: '#7FFFD4',             // seafoam = positive/complete
    warning: '#FFB347',             // amber unchanged — still readable on dark
    error: '#FF6B6B',               // design bible --color-coral
    lightGray: '#0F1E32',           // dark slate for subtle fills
    // STRUCTURAL
    divider: 'rgba(255, 255, 255, 0.08)',  // hairline dividers
    shadow: 'rgba(0, 0, 0, 0.4)',          // deep shadow
  },
};

// Typography — UNCHANGED (Outfit fonts still used app-wide for now)
// Login screen is already using Bebas Neue + Syne
// We will migrate other screens to Syne gradually
export const Typography = {
  largeTitle: { fontFamily: 'outfit-bold', fontSize: 34, lineHeight: 41 },
  title1: { fontFamily: 'outfit-bold', fontSize: 28, lineHeight: 34 },
  title2: { fontFamily: 'outfit-bold', fontSize: 22, lineHeight: 28 },
  title3: { fontFamily: 'outfit-medium', fontSize: 20, lineHeight: 25 },
  headline: { fontFamily: 'outfit-medium', fontSize: 17, lineHeight: 22 },
  body: { fontFamily: 'outfit', fontSize: 17, lineHeight: 22 },
  callout: { fontFamily: 'outfit', fontSize: 16, lineHeight: 21 },
  subhead: { fontFamily: 'outfit', fontSize: 15, lineHeight: 20 },
  footnote: { fontFamily: 'outfit', fontSize: 13, lineHeight: 18 },
  caption1: { fontFamily: 'outfit', fontSize: 12, lineHeight: 16 },
  caption2: { fontFamily: 'outfit', fontSize: 11, lineHeight: 13 },
};

// Spacing — UNCHANGED
export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

// BorderRadius — UNCHANGED
export const BorderRadius = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999,
};

// Shadows — dark mode shadows updated to match new palette
export const Shadows = {
  light: {
    // UNCHANGED
    small: {
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 6,
    },
    large: {
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};