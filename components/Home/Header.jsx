// components/Home/Header.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Avatar } from '../UI/Avatar';

export default function Header() {
  const { user } = useUser();
  
  // Animation for the greeting
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingTranslateY = useRef(new Animated.Value(-10)).current;
  
  // Animation for the user info
  const userInfoOpacity = useRef(new Animated.Value(0)).current;
  const userInfoTranslateY = useRef(new Animated.Value(10)).current;
  
  useEffect(() => {
    // Staggered animation for the greeting and user info
    Animated.sequence([
      Animated.parallel([
        Animated.timing(greetingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(greetingTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(userInfoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(userInfoTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  // Function to get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Animated.Text 
            style={[
              styles.greeting,
              {
                opacity: greetingOpacity,
                transform: [{ translateY: greetingTranslateY }]
              }
            ]}
          >
            {getGreeting()},
          </Animated.Text>
          
          <Animated.Text 
            style={[
              styles.userName,
              {
                opacity: userInfoOpacity,
                transform: [{ translateY: userInfoTranslateY }]
              }
            ]}
          >
            {user?.firstName || user?.fullName.split(' ')[0]}
          </Animated.Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
          
          <Avatar 
            source={{ uri: user?.imageUrl }} 
            name={user?.fullName}
            size="medium" 
          />
        </View>
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.light.textTertiary} />
          <Text style={styles.searchPlaceholder}>
            Search workouts or exercises...
          </Text>
        </View>
        
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={Colors.light.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  leftSection: {
    flex: 1,
  },
  greeting: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  userName: {
    ...Typography.title1,
    color: Colors.light.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    ...Typography.body,
    color: Colors.light.textTertiary,
    marginLeft: Spacing.sm,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});