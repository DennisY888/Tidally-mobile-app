// app/(tabs)/_layout.jsx
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFavorites } from '../../hooks/useFavorites';
import { useUser } from '@clerk/clerk-expo'
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { user } = useUser();
  const { refresh } = useFavorites(user);
  const { colors, isDark } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
        }
      }}
    >
      <Tabs.Screen name='home'
        options={{
          title:'Home',
          headerShown:false,
          tabBarIcon:({color}) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen name='favorite'
        options={{
          title: 'Favorite',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />
        }}
        listeners={{
          tabPress: () => {
            refresh();
          }
        }}
      />
      <Tabs.Screen name='profile'
        options={{
          title:'Profile',
          headerShown:false,
          tabBarIcon:({color}) => <Ionicons name="people-circle" size={24} color={color} />
        }}
      />
      <Tabs.Screen name='resume'
        options={{
          title:'Resume',
          headerShown:false,
          tabBarIcon:({color}) => <Ionicons name="play-circle" size={24} color={color} />
        }}
      />
    </Tabs>
  )
}