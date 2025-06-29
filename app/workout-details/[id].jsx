// app/workout-details/[id].jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import WorkoutSessionService from '../../services/WorkoutSessionService';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import MarkFav from '../../components/MarkFav';
import ExercisesList from '../../components/WorkoutDetails/ExercisesList';
import AddExerciseModal from '../../components/WorkoutDetails/AddExerciseModal';
import EditExerciseModal from '../../components/WorkoutDetails/EditExerciseModal';
import WorkoutStats from '../../components/WorkoutDetails/WorkoutStats';
import AnimatedWorkoutHeader from '../../components/WorkoutDetails/AnimatedWorkoutHeader';
import { useWorkoutActions } from '../../hooks/useWorkoutActions';
import { WorkoutService } from '../../services/WorkoutService';
import ExerciseActionSheet from '../../components/WorkoutDetails/ExerciseActionSheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useActiveWorkout } from '../../context/WorkoutDetailContext'; 


// Constants
const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = height * 0.5;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;


/**
 * Workout Details Screen
 * 
 * Displays detailed information about a workout, its exercises,
 * and allows users to interact with the workout.
 */
export default function WorkoutDetails() {
  const { activeWorkout: workout } = useActiveWorkout();

  if (!workout) {
    // We can optionally try to fetch the workout using the ID from the URL here
    // For now, a loading indicator or redirect is a safe pattern.
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  
  // Hooks
  const navigation = useNavigation();
  const { user } = useUser();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State
  const [workoutExercises, setWorkoutExercises] = useState(workout.exercises);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // Animation values
  const exercisesOpacity = useRef(new Animated.Value(1)).current;
  const creatorOpacity = useRef(new Animated.Value(0)).current;
  
  // Custom hook for workout actions
  const {
    handleShare,
    handlePlayWorkout,
    addExercise,
    saveEditedExercise,
    handleDeleteExercise,
    selectedExerciseIndex,
    setSelectedExerciseIndex
  } = useWorkoutActions(workout, workoutExercises, setWorkoutExercises, router);

  const bottomSheetRef = useRef(null);


  useEffect(() => {
    // Initially set workoutExercises from the params
    setWorkoutExercises(workout.exercises);
    
    // Then fetch the latest data from Firestore using WorkoutService
    const fetchLatestWorkoutData = async () => {
      try {
        // Use the service instead of direct Firestore query
        const latestData = await WorkoutService.getWorkoutById(workout.id);
        
        // Update exercises with the latest data
        if (latestData && latestData.exercises && latestData.exercises.length > 0) {
          setWorkoutExercises(latestData.exercises);
        }
      } catch (error) {
        console.error("Error fetching latest workout data:", error);
      }
    };
    
    fetchLatestWorkoutData();
  }, [workout.id]);
  

  // Setup header on component mount
  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.deleteButton]}
            onPress={handleWorkoutDelete}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.favoriteButton}>
            <MarkFav workout={workout} />
          </View>
        </View>
      ),
    });
  }, [workout]);
  

  /**
   * Handle adding a new exercise
   */
  const handleAddExercise = () => {
    setIsAddModalVisible(true);
  };

  
  /**
   * Handle drag start event
   */
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);


  // Enhanced handleStartWorkout with explicit session deletion
  const handleStartWorkout = async () => {
    try {
      // Show loading indicator if needed
      
      // Delete any existing saved session for this workout
      const deleteResult = await WorkoutSessionService.deleteSession(workout.id);
      console.log(`Previous session for workout ${workout.id} deleted: ${deleteResult}`);
      
      // Navigate to workout play screen
      router.push({
        pathname: '/workout-play',
        params: {
          ...workout,
          exercises: JSON.stringify(workoutExercises),
          isResuming: 'false'
        }
      });
    } catch (error) {
      console.error("Error starting workout:", error);
      // Handle the error if needed
      
      // Still try to navigate even if session deletion failed
      router.push({
        pathname: '/workout-play',
        params: {
          ...workout,
          exercises: JSON.stringify(workoutExercises),
          isResuming: 'false'
        }
      });
    }
  };


  const handleWorkoutDelete = useCallback(async () => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${workout.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              const success = await WorkoutService.deleteWorkout(
                workout.id, 
                workout.user?.email
              );
              
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back(); // Navigate back after successful deletion
              } else {
                Alert.alert("Error", "Failed to delete workout. Please try again.");
              }
            } catch (error) {
              console.error("Error deleting workout:", error);
              Alert.alert("Error", "Failed to delete workout. Please try again.");
            }
          }
        }
      ]
    );
  }, [workout, router]);


  const invalidateHomeCache = async () => {
    try {
      // Clear specific caches that might contain this workout
      await AsyncStorage.removeItem('cached_recent_workouts');
      await AsyncStorage.removeItem('cached_popular_workouts');
      await AsyncStorage.removeItem(`cached_category_${workout.category}`);
    } catch (error) {
      console.error("Error invalidating cache:", error);
    }
  };

  
  /**
   * Handle drag end and update exercise order
   * @param {Object} data - The reordered exercises data
   */
  const handleDragEnd = async ({ data }) => {
    try {
      setIsDragging(false);
      setIsUpdatingOrder(true);
      
      // Update local state first for immediate feedback
      setWorkoutExercises(data);
      
      // Update the workout using the service
      const success = await WorkoutService.updateWorkoutExercises(
        workout.id, 
        data, 
        new Date() // Add a timestamp for tracking changes
      );
      
      if (success) {
        // Success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("Workout update failed");
      }
    } catch (error) {
      console.error('Error updating exercise order:', error);
      
      // Revert to original order on error
      setWorkoutExercises(workout.exercises);
      
      // Error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        "Update Failed",
        "There was a problem saving your workout order. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingOrder(false);
      invalidateHomeCache();
    }
  };
  
  
  /**
   * Handle exercise options (edit/delete)
   * @param {Object} exercise - The exercise to edit/delete
   * @param {number} index - The index of the exercise
   */
  const handleExerciseOptions = (exercise, index) => {
    setSelectedExerciseIndex(index); // Set the index for use by other functions.
    bottomSheetRef.current?.present(exercise, index);
  };


  /**
   * Handles the 'Edit' action from the bottom sheet.
   * This function contains the logic that was previously inside the Alert's onPress.
   * @param {Object} exercise - The exercise to be edited.
   * @param {number} index - The index of the exercise.
   */
  const handleEdit = (exercise, index) => {
    // This logic is moved directly from the old Alert's onPress callback.
    setSelectedExerciseIndex(index);
    setSelectedExercise({...exercise});
    setIsEditModalVisible(true);
  };
  
  

  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });
  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.background }]}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          
          {/* Animated Header */}
          <AnimatedWorkoutHeader
            workout={workout}
            headerHeight={headerHeight}
            headerOpacity={headerOpacity}
            headerTitleOpacity={headerTitleOpacity}
          />
          
          <Animated.ScrollView
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: HEADER_MAX_HEIGHT }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Workout Info */}
            <View style={styles.workoutInfo}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: isDark ? colors.text : colors.text }]}>
                  {workout.title}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: isDark ? colors.primaryLight : colors.primaryLight }]}>
                  <Text style={[styles.categoryText, { color: isDark ? colors.primary : colors.primary }]}>
                    {workout.category}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.description, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                {workout.description || 'Complete all sets of each exercise with proper form for best results.'}
              </Text>
              
              {/* Workout Stats */}
              <WorkoutStats 
                workout={workout} 
                isDark={isDark} 
                colors={colors} 
              />
              
              <View style={styles.exerciseList}>
                <ExercisesList 
                  exercises={workoutExercises} 
                  onDragEnd={handleDragEnd}
                  onDragStart={handleDragStart}
                  onExerciseOptions={handleExerciseOptions}
                  onAddExercise={handleAddExercise}
                  isUpdatingOrder={isSaving}
                />
              </View>
            </View>
          </Animated.ScrollView>
          
          {/* Loading Indicator for Exercise Reordering */}
          {isUpdatingOrder && (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingIndicator, { backgroundColor: colors.background }]}>
                <Ionicons name="refresh" size={24} color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Saving order...</Text>
              </View>
            </View>
          )}
          
          {/* Start Workout Button */}
          <View style={[styles.bottomBar, { 
            backgroundColor: isDark ? colors.background : colors.background,
            borderTopColor: isDark ? colors.divider : colors.divider
          }]}>
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: isDark ? colors.primary : colors.primary }]}
              onPress={handleStartWorkout}
            >
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>

          {/* Modals */}
          <AddExerciseModal
            visible={isAddModalVisible}
            onClose={() => setIsAddModalVisible(false)}
            onAdd={addExercise}
          />

          {isEditModalVisible && selectedExercise && (
            <EditExerciseModal
            visible={isEditModalVisible}
            onClose={() => setIsEditModalVisible(false)}
            exercise={selectedExercise}
            onSave={(editedExercise) => {
              saveEditedExercise(editedExercise);
              // Don't close modal here - it will be closed by saveEditedExercise
            }}
          />
          )}

          <ExerciseActionSheet
            ref={bottomSheetRef}
            onEdit={handleEdit}
            onDelete={handleDeleteExercise}
          />

        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  workoutInfo: {
    padding: Spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title1,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.md,
  },
  categoryText: {
    ...Typography.caption1,
    fontFamily: 'outfit-medium',
  },
  description: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  tabContentContainer: {
    // Container for tab content
  },
  tabContent: {
    // Content within each tab
  },
  exerciseList: {
    marginBottom: Spacing.xl,
  },
  creatorContent: {
    // Creator tab content
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingIndicator: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  loadingText: {
    ...Typography.body,
    marginLeft: Spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    ...Shadows.medium,
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  startButtonText: {
    ...Typography.headline,
    color: '#fff',
    marginLeft: Spacing.sm,
  },
  savingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 5,
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  savingText: {
    ...Typography.caption1,
    marginLeft: 4,
  },
  savingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 5,
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  savingText: {
    ...Typography.caption1,
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingIndicator: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  loadingText: {
    ...Typography.body,
    marginLeft: Spacing.sm,
  },
  deleteButton: {
    backgroundColor: 'rgba(248, 114, 114, 0.3)', // Semi-transparent red
    borderWidth: 1,
    borderColor: 'rgba(248, 114, 114, 0.5)',
  },
});