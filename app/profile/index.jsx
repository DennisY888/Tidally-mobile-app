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
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../config/FirebaseConfig';
import SettingsOption from '../../components/Profile/SettingsOption';
import SettingsSection from '../../components/Profile/SettingsSection';
import StatItem from '../../components/Profile/StatItem';
import { WorkoutService } from '../../services/WorkoutService';
import ProfileCustomizationModal from '../../components/Profile/ProfileCustomizationModal';
import { useUserProfile } from '../../context/UserProfileContext';
import { getSVGComponent, adaptColorForDarkMode } from '../../constants/ProfileIcons';
import { LinearGradient } from 'expo-linear-gradient';


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
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  const { userProfile } = useUserProfile();
  

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });

    if (!user?.primaryEmailAddress?.emailAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // ✅ REAL-TIME LISTENER FOR WORKOUTS COUNT
    const workoutsQuery = query(
      collection(db, 'Routines'),
      where('user.email', '==', user.primaryEmailAddress.emailAddress)
    );
    
    const unsubscribeWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
      const workoutCount = snapshot.docs.length;
      
      setStats(prevStats => ({
        ...prevStats,
        totalWorkouts: workoutCount // ✅ UPDATES IMMEDIATELY WHEN WORKOUTS CHANGE
      }));
      
      setIsLoading(false);
    }, (error) => {
      console.error("Error with workouts stats snapshot:", error);
      setIsLoading(false);
    });

    // ✅ REAL-TIME LISTENER FOR FAVORITES COUNT  
    const favoritesQuery = query(
      collection(db, 'Favorites'),
      where('email', '==', user.primaryEmailAddress.emailAddress)
    );
    
    const unsubscribeFavorites = onSnapshot(favoritesQuery, (snapshot) => {
      const favoritesCount = snapshot.docs[0]?.data()?.favorites?.length || 0;
      
      setStats(prevStats => ({
        ...prevStats,
        favorites: favoritesCount // ✅ UPDATES IMMEDIATELY WHEN FAVORITES CHANGE
      }));
    }, (error) => {
      console.error("Error with favorites stats snapshot:", error);
    });

    // ✅ CLEANUP BOTH LISTENERS
    return () => {
      unsubscribeWorkouts();
      unsubscribeFavorites();
    };
  }, [user?.primaryEmailAddress?.emailAddress]);
  

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
        <TouchableOpacity
          onPress={() => setShowCustomizationModal(true)}
          activeOpacity={0.8}
        >
          {userProfile?.customProfile?.useCustom ? (
            <MotiView
              animate={{
                scale: [1, 1.05, 1],
                rotateY: ['0deg', '5deg', '-5deg', '0deg'],
              }}
              transition={{
                type: 'timing',
                duration: 4000,
                repeat: Infinity,
              }}
            >
              <View 
                style={[
                  styles.profileImage,
                  styles.premiumProfileContainer,
                  styles.profileImageCentering,
                  styles.superGrandProfileContainer,
                  {
                    borderColor: colors.primary + '60',
                    shadowColor: colors.primary,
                    ...Shadows[isDark ? 'dark' : 'light'].large,
                  }
                ]}
              >
                {/* Conditional background rendering */}
                {userProfile.customProfile.backgroundType === 'gradient' && userProfile.customProfile.gradientColors ? (
                  <LinearGradient
                    colors={
                      isDark 
                        ? userProfile.customProfile.gradientColors.map(color => adaptColorForDarkMode(color))
                        : userProfile.customProfile.gradientColors
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 50 }]}
                  />
                ) : (
                  <View 
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        backgroundColor: isDark ? 
                          adaptColorForDarkMode(userProfile.customProfile.backgroundColor) : 
                          userProfile.customProfile.backgroundColor,
                        borderRadius: 50,
                      }
                    ]} 
                  />
                )}
                
                {(() => {
                  const SVGComponent = getSVGComponent(
                    userProfile.customProfile.animalType,
                    userProfile.customProfile.animalColor
                  );
                  return SVGComponent ? <SVGComponent width={85} height={85} /> : null;
                })()}
                
                {/* Premium glow effect */}
                <MotiView
                  style={styles.glowRing}
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    type: 'timing',
                    duration: 3000,
                    repeat: Infinity,
                  }}
                >
                  <View style={[styles.innerGlow, { borderColor: colors.primary + '40' }]} />
                </MotiView>
                
                {/* Floating particles */}
                <MotiView
                  style={styles.particleContainer}
                  animate={{
                    rotate: ['0deg', '360deg'],
                  }}
                  transition={{
                    type: 'timing',
                    duration: 20000,
                    repeat: Infinity,
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <MotiView
                      key={index}
                      style={[
                        styles.particle,
                        {
                          transform: [{ rotate: `${index * 60}deg` }],
                          backgroundColor: colors.accent,
                        }
                      ]}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                      }}
                      transition={{
                        type: 'timing',
                        duration: 2000,
                        repeat: Infinity,
                        delay: index * 333,
                      }}
                    />
                  ))}
                </MotiView>
              </View>
            </MotiView>
          ) : (
            <Image source={{ uri: user.imageUrl }} style={[styles.profileImage, { borderColor: colors.primaryLight }]} />
          )}
        </TouchableOpacity>
        
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
      </View>
      
      {/* User Stats */}
      <View style={styles.statsContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <View style={styles.statItemWrapper}>
              <StatItem 
                value={stats.totalWorkouts} 
                label="Workouts Created" 
                icon="barbell-outline"
              />
            </View>
            <View style={styles.statItemWrapper}>
              <StatItem 
                value={stats.favorites} 
                label="Favorites" 
                icon="heart-outline"
              />
            </View>
            <View style={styles.statItemWrapper}>
              <StatItem 
                value={stats.completedWorkouts} 
                label="Completed" 
                icon="checkmark-circle-outline"
              />
            </View>
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

      <ProfileCustomizationModal
        visible={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
      />
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
    justifyContent: 'space-between', // Changed from space-around
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl, // Add horizontal padding for symmetry
    marginHorizontal: Spacing.md, // Add margin for better edge spacing
  },
  statItemWrapper: {
    flex: 1, // Equal width distribution
    alignItems: 'center',
    justifyContent: 'center',
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
  premiumProfileContainer: {
    borderWidth: 1.5, // Reduced from 4 to 1.5
    shadowOffset: {
      width: 0,
      height: 4, // Increased shadow for depth without thick border
    },
    shadowOpacity: 0.15, // Reduced from 0.3
    shadowRadius: 12, // Increased from 8
    elevation: 6, // Reduced from 12
  },
  profileImageCentering: {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  superGrandProfileContainer: {
    borderWidth: 3, // Increased from 1.5
    shadowOffset: {
      width: 0,
      height: 8, // Increased shadow
    },
    shadowOpacity: 0.3, // Increased opacity
    shadowRadius: 20, // Increased radius
    elevation: 10, // Increased elevation
  },
  glowRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60, // Larger than profile image
  },
  innerGlow: {
    flex: 1,
    borderRadius: 60,
    borderWidth: 2,
  },
  particleContainer: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: 15,
    left: '50%',
    marginLeft: -2,
  },
});