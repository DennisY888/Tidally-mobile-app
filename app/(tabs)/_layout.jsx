import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFavorites } from '../../hooks/useFavorites';
import { useUser } from '@clerk/clerk-expo'

export default function TabLayout() {
  const {user}=useUser();
  const { refresh } = useFavorites(user);


  return (
    <Tabs
    screenOptions={{
      tabBarActiveTintColor: "#6366F1",
      tabBarInactiveTintColor: "#94A3B8",  
        tabBarStyle: {
          backgroundColor: "#FFFFFF"  // White background
        }
    }}
    >
        <Tabs.Screen name='home'
          options={{
            title:'Home',
            headerShown:false,
            tabBarIcon:({color})=><Ionicons name="home" size={24} color={color} />  // uses default system color
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
              console.log("LOL");
            }
          }}
        />
        <Tabs.Screen name='inbox'
        options={{
          title:'Inbox',
          headerShown:false,
          tabBarIcon:({color})=><Ionicons name="chatbubble" size={24} color={color} />
        }}/>
        <Tabs.Screen name='profile'
        options={{
          title:'Profile',
          headerShown:false,
          tabBarIcon:({color})=><Ionicons name="people-circle" size={24} color={color} />
        }}/>

    </Tabs>
  )
}