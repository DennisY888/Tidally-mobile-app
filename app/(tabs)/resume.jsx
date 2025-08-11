// app/(tabs)/resume.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  Alert,

} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import WorkoutSessionService from '../../services/WorkoutSessionService';
import { WorkoutService } from '../../services/WorkoutService';


export default function Resume() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [savedSessions, setSavedSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation();

  // Load saved sessions
  // Enhanced loadSessions function with better error handling and state management
const loadSessions = useCallback(async () => {
  try {
    setRefreshing(true);
    const sessions = await WorkoutSessionService.getSavedSessions();

    const validatedSessions = await Promise.all(
      sessions.map(async (session) => {
        try {
          // Check if workout still exists in Firestore
          const workout = await WorkoutService.getWorkoutById(session.workoutId);
          
          if (!workout) {
            // Workout was deleted, mark session as orphaned
            console.log(`Orphaned session found for deleted workout: ${session.workoutId}`);
            return { ...session, isOrphaned: true };
          }
          
          // Workout exists, session is valid
          return { ...session, isOrphaned: false };
        } catch (error) {
          console.error(`Error validating session ${session.workoutId}:`, error);
          return { ...session, isOrphaned: true };
        }
      })
    );
    
    // Process the sessions to ensure all required fields exist
    const processedSessions = sessions.map(session => ({
      workoutId: session.workoutId || '',
      workoutTitle: session.workoutTitle || 'Unnamed Workout',
      workoutImageUrl: session.workoutImageUrl || '',
      exercises: Array.isArray(session.exercises) ? session.exercises : [],
      progress: typeof session.progress === 'number' ? session.progress : 0,
      elapsedTime: typeof session.elapsedTime === 'number' ? session.elapsedTime : 0,
      lastAccessedAt: session.lastAccessedAt || new Date().toISOString(),
      isOrphaned: session.isOrphaned || false
    }));
    
    // Sort by most recent first
    const sortedSessions = processedSessions.sort((a, b) => 
      new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
    );
    
    setSavedSessions(sortedSessions);
  } catch (error) {
    console.error("Error loading saved sessions:", error);
    // Handle the error gracefully in the UI if needed
    setSavedSessions([]);
  } finally {
    setRefreshing(false);
  }
}, []);
  
  // Initial load on component mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);
  
  // Load sessions when screen is accessed
  // This is a simplified approach for Expo Router
  useEffect(() => {
    // Using a dummy value from params to trigger the effect when navigating
    const triggerRefresh = params?.refresh || 'initial';
    loadSessions();
  }, [params?.refresh, loadSessions]);

  useEffect(() => {
    // Initial load happens in the other useEffect
    
    // Create a listener for when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Resume tab focused - refreshing data');
      loadSessions();
    });
    
    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, [navigation, loadSessions]);
  
  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };
  
  // Format elapsed time
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Navigate to resume workout
  const handleResumeWorkout = (session) => {
    try {
      console.log("Resuming workout with ID:", session.workoutId);
      
      // Update timestamp for most recent sorting
      const updatedSession = {
        ...session,
        lastAccessedAt: new Date().toISOString()
      };
      
      // Save updated session (preserves all data but updates timestamp)
      WorkoutSessionService.saveSession(updatedSession);
      
      // Include ALL fields when navigating
      router.push({
        pathname: '/workout-play',
        params: {
          id: session.workoutId,
          title: session.workoutTitle || "Workout",
          workoutTitle: session.workoutTitle,  // Include both formats for safety
          imageUrl: session.workoutImageUrl || "",
          workoutImageUrl: session.workoutImageUrl,
          category: session.category || "",
          description: session.description || "",
          est_time: session.est_time || "0",
          exercises: JSON.stringify(session.exercises || []),
          elapsedTime: session.elapsedTime || 0,
          progress: session.progress || 0,
          isResuming: 'true'
        }
      });
    } catch (error) {
      console.error("Error resuming workout:", error);
    }
  };


  const handleOrphanedSession = useCallback((session) => {
    Alert.alert(
      "Workout No Longer Available",
      `"${session.workoutTitle}" has been deleted and cannot be resumed.\n\nWould you like to remove this session?`,
      [
        { text: "Keep Session", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => handleCleanupOrphanedSession(session)
        }
      ]
    );
  }, []);
  

  const handleCleanupOrphanedSession = useCallback(async (session) => {
    try {
      await WorkoutSessionService.deleteSession(session.workoutId);
      // Refresh the sessions list
      loadSessions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error cleaning up orphaned session:", error);
      Alert.alert("Error", "Failed to remove session. Please try again.");
    }
  }, [loadSessions]);

  
  // Render a session item
  const renderSessionItem = ({ item }) => {
    const progress = Math.round(item.progress * 100);
    const progressColor = progress < 30 ? colors.error : 
                          progress < 70 ? colors.warning : 
                          colors.success;
    const isOrphaned = item.isOrphaned;
    
    return (
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: colors.background }, isOrphaned && styles.orphanedCard]}
        onPress={() => isOrphaned ? handleOrphanedSession(item) : handleResumeWorkout(item)}
        disabled={isOrphaned}
      >
        <View style={styles.sessionHeader}>
        <Image 
          source={{ 
            uri: item.workoutImageUrl 
              ? item.workoutImageUrl.replace(/\/Tidally\//g, '/Tidally%2F')
              : undefined
          }}
          style={[styles.workoutImage, isOrphaned && styles.orphanedImage]}
          onError={(e) => {
            console.log(`🔍 Image Error (after re-encoding):`, {
              workoutTitle: item.workoutTitle,
              originalUrl: item.workoutImageUrl,
              encodedUrl: item.workoutImageUrl?.replace(/\/Tidally\//g, '/Tidally%2F'),
              error: e.nativeEvent.error
            });
          }}
        />
          
          <View style={styles.sessionInfo}>
            <View style={styles.titleContainer}>
              <Text style={[styles.workoutTitle, { color: isOrphaned ? colors.textTertiary : colors.text }]}>
                {item.workoutTitle}
              </Text>
              {isOrphaned && (
                <View style={[styles.orphanedBadge, { backgroundColor: colors.error }]}>
                  <Ionicons name="warning" size={12} color="#fff" />
                  <Text style={styles.orphanedBadgeText}>Deleted</Text>
                </View>
              )}
            </View>
            <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
              Last played {new Date(item.lastAccessedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.timeInfo}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatElapsedTime(item.elapsedTime)}
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: isOrphaned ? colors.textTertiary : progressColor }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress}% Complete
            </Text>
          </View>
        </View>

        {isOrphaned && (
          <TouchableOpacity 
            style={[styles.cleanupButton, { backgroundColor: colors.error }]}
            onPress={() => handleCleanupOrphanedSession(item)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.cleanupButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Resume Workouts
      </Text>
      
      {savedSessions.length > 0 ? (
        <FlatList
          data={savedSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.workoutId}
          contentContainerStyle={styles.sessionList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workouts to resume
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Start a workout and exit to save your progress
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg
  },
  title: {
    marginTop: Spacing.lg,
    ...Typography.title1,
    marginBottom: Spacing.lg,
  },
  sessionList: {
    paddingBottom: 20,
  },
  sessionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  sessionHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  workoutImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  workoutTitle: {
    ...Typography.headline,
    marginBottom: 4,
  },
  sessionDate: {
    ...Typography.caption1,
  },
  progressSection: {
    marginTop: Spacing.xs,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    ...Typography.footnote,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption2,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.title3,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.subhead,
    textAlign: 'center',
  },
  orphanedCard: {
    opacity: 0.6,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  orphanedImage: {
    opacity: 0.4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orphanedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: 8,
  },
  orphanedBadgeText: {
    ...Typography.caption2,
    color: '#fff',
    marginLeft: 2,
    fontFamily: 'outfit-medium',
  },
  cleanupButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  cleanupButtonText: {
    ...Typography.caption2,
    color: '#fff',
    marginLeft: 4,
    fontFamily: 'outfit-medium',
  },
});