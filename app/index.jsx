// app/index.jsx 
import { useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import 'react-native-reanimated';
import { useTheme } from "../context/ThemeContext";


export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const { user, isLoaded } = useUser();
  const { colors, isThemeLoaded } = useTheme();

  
  // Simple delay to ensure app is fully loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading indicator while states initialize
  if (!isLoaded || !isThemeLoaded || !isReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors?.background || '#ffffff' 
      }}>
        <ActivityIndicator size="large" color={colors?.primary || '#0066ff'} />
      </View>
    );
  }

  // Use Redirect component for navigation once fully loaded
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {user ? (
        <Redirect href={'/(tabs)/home'} />
      ) : (
        <Redirect href={'/login'} />
      )}
    </View>
  );
}