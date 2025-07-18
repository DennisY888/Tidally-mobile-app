// app/workout-play/index.jsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  StatusBar,
  BackHandler,
  View,
  Text
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Spacing, BorderRadius, Typography } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import WorkoutHeader from '../../components/WorkoutPlay/WorkoutHeader';
import ExerciseInstructions from '../../components/WorkoutPlay/ExerciseInstructions';
import ExerciseItem from '../../components/WorkoutPlay/ExerciseItem';
import CompletionBar from '../../components/WorkoutPlay/CompletionBar';
import { useWorkoutPlayback } from '../../hooks/useWorkoutPlayback';
import * as Haptics from 'expo-haptics';
import CountdownTimer from '../../components/WorkoutPlay/CountdownTimer';


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
      }, 300);
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
    
    if (activeIndex !== -1) {
      if (index === activeIndex) {
        opacity = 1;
        scale = 1.05;
      } else if (index === activeIndex + 1) {
        opacity = 0.7;
        scale = 1;
      } else {
        opacity = 0.5;
        scale = 0.95;
      }
    }

    return (
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

      {/* TODO delete later */}
      {/* Floating Timer Overlay */}
      {/* {sessionExercises.some(ex => ex.isTimerActive) && (() => {
        const activeExercise = sessionExercises.find(ex => ex.isTimerActive);
        return (
          <View style={styles.floatingTimerOverlay}>
            <View style={[
              {
                backgroundColor: colors.background,
                borderRadius: BorderRadius.xl,
                padding: Spacing.xl,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }
            ]}>
              <Text style={[
                {
                  ...Typography.title2,
                  marginBottom: Spacing.lg,
                  textAlign: 'center',
                }, 
                { color: colors.text }]}>
                {activeExercise.name}
              </Text>
              <CountdownTimer
                duration={activeExercise.time}
                onComplete={() => handleSetComplete(activeExercise.name)}
                isPaused={activeExercise.isPaused}
              />
            </View>
          </View>
        );
      })()} */}
      
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