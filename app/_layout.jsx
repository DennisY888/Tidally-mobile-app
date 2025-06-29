// app/_layout.jsx
import "../global.css";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider } from '@clerk/clerk-expo';
import { ThemeProvider } from '../context/ThemeContext';
import { NetworkProvider } from '../context/NetworkContext';
import { StatusBar, View, ActivityIndicator, AppState } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Colors } from '../constants/Colors';
import { FavoritesProvider } from '../hooks/useRealtimeFavorites';
import { WorkoutDetailProvider } from '../context/WorkoutDetailContext';


// Token cache implementation for Clerk
const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};


// StatusBar controller that manages status bar appearance based on theme and current route
function StatusBarController() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef(null);
  
  // Check if on login screen to avoid overriding login screen's status bar
  const currentRoute = router.pathname || '';
  const isLoginScreen = currentRoute.includes('/login');
  
  // Update status bar based on theme and current route
  useEffect(() => {
    // Don't update if on login screen (login screen manages its own status bar)
    if (isLoginScreen) {
      console.log('On login screen, not enforcing theme-based status bar');
      return;
    }
    
    // Function to update status bar
    const updateStatusBar = () => {
      StatusBar.setHidden(true); // Hide status bar for the entire app
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(isDark ? colors.background : colors.background);
      }
    };
    
    // Call immediately
    updateStatusBar();
    
    // Set up interval to keep updating status bar (helps with dev reloads)
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateStatusBar, 1000);
    
    // Set up app state change listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current !== nextAppState) {
        if (nextAppState === 'active') {
          // App came to foreground, update status bar immediately
          updateStatusBar();
        }
        appState.current = nextAppState;
      }
    });
    
    // Clean up
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [isDark, colors, isLoginScreen, currentRoute]);
  
  return null;
}


// Main app container with theme
function ThemedApp({ children }) {
  const { colors, isThemeLoaded } = useTheme();
  
  if (!isThemeLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}


export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [fontsLoaded] = useFonts({
    'outfit': require('./../assets/fonts/Outfit-Regular.ttf'),
    'outfit-medium': require('./../assets/fonts/Outfit-Medium.ttf'),
    'outfit-bold': require('./../assets/fonts/Outfit-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      <NetworkProvider>
        <ThemeProvider>
          <StatusBar hidden={true} />
          <FavoritesProvider>
            <WorkoutDetailProvider>
              <ThemedApp>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login/index" options={{ headerShown: false }} />
                  <Stack.Screen name="stopwatch/index" options={{ headerShown: false }} />
                </Stack>
              </ThemedApp>
            </WorkoutDetailProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </NetworkProvider>
    </ClerkProvider>
  );
}