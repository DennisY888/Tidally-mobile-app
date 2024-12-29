/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2E5C8A';  // Deep ocean blue
const tintColorDark = '#64A1D6';   // Bright ocean blue

export const Colors = {
  light: {
    text: '#1A2B3D',          // Deep slate blue
    background: '#FFFFFF',     // Pure white
    tint: tintColorLight,
    primary: '#2E5C8A',       // Deep ocean blue
    secondary: '#88B6E0',     // Soft sky blue
    lightGray: '#F6F9FC',     // Ice blue
    shadow: 'rgba(37, 99, 235, 0.08)',  // Subtle blue shadow
  },
  dark: {
    text: '#E5EDF5',          // Soft white with blue tint
    background: '#0A1829',    // Deep ocean night
    tint: tintColorDark,
    primary: '#64A1D6',       // Bright ocean blue
    secondary: '#3D718F',     // Muted ocean blue
    lightGray: '#1C2B3A',     // Dark slate
    shadow: 'rgba(9, 30, 66, 0.25)',    // Deep ocean shadow
  },
};
