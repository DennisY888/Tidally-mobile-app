// app/profile/index.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../config/FirebaseConfig';
import SettingsOption from '../../components/Profile/SettingsOption';
import SettingsSection from '../../components/Profile/SettingsSection';
import StatItem from '../../components/Profile/StatItem';
import { WorkoutService } from '../../services/WorkoutService';


/**
 * Profile Screen
 * 
 * Displays user profile information, stats, and app settings
 */
export default function Profile() {
  // Hooks
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { colors, isDark, setTheme, theme } = useTheme();

  const navigation = useNavigation()
  
  // State
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    favorites: 0,
    completedWorkouts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Load user stats on component mount
  useEffect(() => {
    navigation.setOptions({
        headerShown: false
      });

    if (user) {
      fetchUserStats();
    }
  }, [user]);
  

  /**
   * Fetches user statistics from Firestore
   */
  const fetchUserStats = async () => {
    setIsLoading(true);
    try {
      // Get workouts created by user using WorkoutService
      const { workouts } = await WorkoutService.getWorkouts({
        userEmail: user?.primaryEmailAddress?.emailAddress
      });
      
      // Get user favorites
      const favoritesQuery = query(
        collection(db, 'Favorites'),
        where('email', '==', user?.primaryEmailAddress?.emailAddress)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      
      // Get completed workouts (assuming you have a collection for this)
      // For now we'll use a placeholder value
      const completedWorkouts = 0;
      
      setStats({
        totalWorkouts: workouts.length,
        favorites: favoritesSnapshot.docs[0]?.data()?.favorites?.length || 0,
        completedWorkouts: completedWorkouts
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  /**
   * Handles dark mode toggle
   * @param {boolean} value - Whether dark mode is enabled
   */
  const handleThemeChange = (value) => {
    setTheme(value ? 'dark' : 'light');
  };
  
  /**
   * Handles system theme setting toggle
   * @param {boolean} value - Whether to use system theme
   */
  const handleUseSystemTheme = (value) => {
    setTheme(value ? 'system' : isDark ? 'dark' : 'light');
  };
  
  /**
   * Handles user logout with confirmation
   */
  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace('/login');
          }
        }
      ]
    );
  };
  
  // Loading state
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { 
        backgroundColor: colors.background,
        borderBottomColor: colors.divider
      }]}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <Image 
            source={{ uri: user.imageUrl }}
            style={[styles.profileImage, { 
              borderColor: colors.primaryLight 
            }]}
          />
        </MotiView>
        
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          <Text style={[styles.profileName, { color: colors.text }]}>{user.fullName}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {user.primaryEmailAddress?.emailAddress}
          </Text>
        </MotiView>
        
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => console.log('Edit profile')}
        >
          <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      {/* User Stats */}
      <View style={styles.statsContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <StatItem 
              value={stats.totalWorkouts} 
              label="Workouts Created" 
              icon="barbell-outline"
            />
            <StatItem 
              value={stats.favorites} 
              label="Favorites" 
              icon="heart-outline"
            />
            <StatItem 
              value={stats.completedWorkouts} 
              label="Completed" 
              icon="checkmark-circle-outline"
            />
          </>
        )}
      </View>
      
      {/* Settings */}
      <SettingsSection title="Appearance">
        <SettingsOption
          icon="moon-outline"
          title="Dark Mode"
          type="switch"
          value={isDark}
          onPress={handleThemeChange}
        />
      </SettingsSection>
      
      <SettingsSection title="Account">
        <SettingsOption
          icon="notifications-outline"
          title="Notifications"
          onPress={() => console.log('Navigate to notifications settings')}
        />
        <SettingsOption
          icon="lock-closed-outline"
          title="Privacy & Security"
          onPress={() => console.log('Navigate to privacy settings')}
        />
        <SettingsOption
          icon="shield-checkmark-outline"
          title="Data & Storage"
          onPress={() => console.log('Navigate to data settings')}
        />
      </SettingsSection>
      
      <SettingsSection title="Support">
        <SettingsOption
          icon="help-circle-outline"
          title="Help Center"
          onPress={() => console.log('Navigate to help center')}
        />
        <SettingsOption
          icon="information-circle-outline"
          title="About Tidally"
          onPress={() => console.log('Navigate to about page')}
        />
        <SettingsOption
          icon="mail-outline"
          title="Contact Us"
          onPress={() => console.log('Navigate to contact page')}
        />
      </SettingsSection>
      
      {/* Sign Out Button */}
      <TouchableOpacity 
        style={[styles.signOutButton, { backgroundColor: colors.error + '20' }]}
        onPress={handleLogout}
      >
        <Ionicons name="exit-outline" size={22} color={colors.error} />
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>
      
      {/* App Version */}
      <Text style={[styles.versionText, { color: colors.textTertiary }]}>
        Tidally v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
    borderWidth: 4,
  },
  profileName: {
    ...Typography.title1,
    textAlign: 'center',
  },
  profileEmail: {
    ...Typography.callout,
    textAlign: 'center',
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  editProfileText: {
    ...Typography.subhead,
    fontFamily: 'outfit-medium',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  signOutText: {
    ...Typography.subhead,
    fontFamily: 'outfit-medium',
    marginLeft: Spacing.sm,
  },
  versionText: {
    ...Typography.caption1,
    textAlign: 'center',
  },
});