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
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import WorkoutSessionService from '../../services/WorkoutSessionService';

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
    
    // Process the sessions to ensure all required fields exist
    const processedSessions = sessions.map(session => ({
      workoutId: session.workoutId || '',
      workoutTitle: session.workoutTitle || 'Unnamed Workout',
      workoutImageUrl: session.workoutImageUrl || '',
      exercises: Array.isArray(session.exercises) ? session.exercises : [],
      progress: typeof session.progress === 'number' ? session.progress : 0,
      elapsedTime: typeof session.elapsedTime === 'number' ? session.elapsedTime : 0,
      lastAccessedAt: session.lastAccessedAt || new Date().toISOString()
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
  
  // Render a session item
  const renderSessionItem = ({ item }) => {
    const progress = Math.round(item.progress * 100);
    const progressColor = progress < 30 ? colors.error : 
                          progress < 70 ? colors.warning : 
                          colors.success;
    
    return (
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: colors.background }]}
        onPress={() => handleResumeWorkout(item)}
      >
        <View style={styles.sessionHeader}>
        <Image 
          source={{ 
            uri: item.workoutImageUrl || undefined
          }}
          defaultSource={require('../../assets/images/exercise_icon.png')} // Update path as needed
          style={styles.workoutImage}
          onError={(e) => {
            console.log(`Image load error for workout: ${item.workoutTitle}`);
          }}
        />
          
          <View style={styles.sessionInfo}>
            <Text style={[styles.workoutTitle, { color: colors.text }]}>
              {item.workoutTitle}
            </Text>
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
                  { width: `${progress}%`, backgroundColor: progressColor }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress}% Complete
            </Text>
          </View>
        </View>
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
});