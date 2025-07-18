// app/workout-play/index.jsx
import React, { useRef, useEffect, useState } from 'react';
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
import { BlurView } from 'expo-blur';


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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const flatListRef = useRef(null);


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


  useEffect(() => {
    const activeIndex = sessionExercises.findIndex(ex => ex.isTimerActive);
    if (activeIndex !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.5, 
        });
      }, 100);
    }
  }, [sessionExercises]);
  

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
    const isCurrentExercise = index === currentExerciseIndex;
    const isActive = item.isTimerActive;
    const activeIndex = sessionExercises.findIndex(ex => ex.isTimerActive);
  
    let opacity = 1;
    let scale = 1;
    let shouldBlur = false;
    
    if (activeIndex !== -1) {
      if (index === activeIndex) {
        opacity = 1;
        scale = 1.08; // Slightly larger for more prominence
      } else if (index === activeIndex + 1) {
        opacity = 0.8;
        scale = 1;
        shouldBlur = true;
      } else {
        opacity = 0.6;
        scale = 0.96;
        shouldBlur = true;
      }
    }
  
    const exerciseComponent = (
      <ExerciseItem
        exercise={item}
        index={index}
        isCurrentExercise={isCurrentExercise}
        isActive={isActive}
        opacity={opacity}
        scale={scale}
        onSwipe={() => onExerciseSwipe(item.name, index)}
        onToggleTimer={() => {
          setCurrentExerciseIndex(index);
          toggleTimer(item.name);
        }}
        swipeableRef={ref => swipeableRefs.current[index] = ref}
      />
    );
  
    // Wrap in blur if not active
    if (shouldBlur) {
      return (
        <BlurView intensity={15} style={{ borderRadius: 16 }}>
          {exerciseComponent}
        </BlurView>
      );
    }
  
    return exerciseComponent;
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
        ref={flatListRef}
        data={sessionExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item, index) => `exercise-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: 120, 
          offset: 120 * index,
          index,
        })}
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