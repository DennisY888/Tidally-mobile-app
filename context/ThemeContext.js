// context/ThemeContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

// Create Theme Context
const ThemeContext = createContext({
  theme: 'light',
  colors: Colors.light,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  isThemeLoaded: false
});

// Theme storage key
const THEME_STORAGE_KEY = '@tidally_theme_preference';

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [theme, setThemeState] = useState('system'); // 'light', 'dark', or 'system'
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Effect to load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          console.log('Loaded theme from storage:', savedTheme);
          setThemeState(savedTheme);
        } else {
          console.log('No saved theme found, using system theme');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsThemeLoaded(true);
      }
    };
    loadThemePreference();
  }, []);

  // Save theme preference to storage
  const saveThemePreference = async (newTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      console.log('Saved theme to storage:', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Set theme and save preference
  const setTheme = (newTheme) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    saveThemePreference(newTheme);
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Resolve the actual theme based on preference and device setting
  const resolvedTheme = theme === 'system' ? deviceTheme : theme;
  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Context value
  const contextValue = {
    theme,
    colors,
    isDark,
    setTheme,
    toggleTheme,
    systemTheme: deviceTheme,
    isThemeLoaded
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme
export const useTheme = () => useContext(ThemeContext);