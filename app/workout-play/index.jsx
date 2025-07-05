// app/workout-play/index.jsx
import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  StatusBar,
  BackHandler
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import WorkoutHeader from '../../components/WorkoutPlay/WorkoutHeader';
import ExerciseInstructions from '../../components/WorkoutPlay/ExerciseInstructions';
import ExerciseItem from '../../components/WorkoutPlay/ExerciseItem';
import CompletionBar from '../../components/WorkoutPlay/CompletionBar';
import { useWorkoutPlayback } from '../../hooks/useWorkoutPlayback';
import * as Haptics from 'expo-haptics';

/**
 * Workout Play Screen
 * 
 * Allows users to perform a workout with exercise tracking and timers
 * Supports resuming from a previously saved session
 */
export default function WorkoutPlay() {
  // Parse params
  const params = useLocalSearchParams();
  const isResuming = params.isResuming === 'true';
  const workout = {
    ...params,
    exercises: JSON.parse(params.exercises)
  };
  
  // Hooks
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  // Custom hook for workout playback
  const {
    sessionExercises,
    workoutProgress,
    elapsedTime,
    workoutComplete,
    progressAnim,
    formatTime,
    handleSetComplete,
    toggleTimer,
    playSound,
    completeSound,
    startSound,
    saveSession
  } = useWorkoutPlayback(workout, isResuming);
  
  // Refs
  const swipeableRefs = useRef([]);
  
  // Setup navigation and handle back button
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
    
    // Handle back button - save state and exit
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    
    return () => {
      backHandler.remove();
    };
  }, []);
  
  /**
   * Save session and exit
   */
  const handleExit = async () => {
    // Only save if workout is not complete
    if (!workoutComplete) {
      await saveSession();
    }
    router.back();
  };
  
  /**
   * Handle swipe action on exercise completion
   * @param {string} exerciseName - Name of the exercise
   * @param {number} index - Index of the exercise in the list
   */
  const onExerciseSwipe = (exerciseName, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Play completion sound
    playSound(completeSound);
    
    // Mark set as complete
    handleSetComplete(exerciseName);
    
    // Close swipeable component
    setTimeout(() => {
      swipeableRefs.current[index]?.close();
    }, 300);
  };
  
  /**
   * Render exercise item
   */
  const renderExerciseItem = ({ item, index }) => {
    return (
      <ExerciseItem
        exercise={item}
        index={index}
        onSwipe={() => onExerciseSwipe(item.name, index)}
        onToggleTimer={() => toggleTimer(item.name)}
        swipeableRef={ref => swipeableRefs.current[index] = ref}
      />
    );
  };
  
  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: isDark ? colors.backgroundSecondary : colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <WorkoutHeader
        title={workout.title}
        elapsedTime={elapsedTime}
        progressValue={progressAnim}
        progressPercent={Math.round(workoutProgress * 100)}
        onBack={handleExit}
        isResuming={isResuming}
      />
      
      {/* Instructions */}
      <ExerciseInstructions />
      
      {/* Exercise List */}
      <FlatList
        data={sessionExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item, index) => `exercise-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Completion Bar */}
      {workoutComplete && <CompletionBar onFinish={handleExit} />}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: 100, // Space for bottom bar
  },
});