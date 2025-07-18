// components/WorkoutPlay/ExerciseItem.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import CountdownTimer from './CountdownTimer';


/**
 * Exercise item with swipe actions and timer
 * 
 * @param {Object} props - Component props
 * @param {Object} props.exercise - Exercise data
 * @param {number} props.index - Index for animation delay
 * @param {Function} props.onSwipe - Function to call on swipe
 * @param {Function} props.onToggleTimer - Function to toggle timer
 * @param {Function} props.swipeableRef - Ref for swipeable component
 * @returns {React.ReactNode}
 */
const ExerciseItem = ({ 
  exercise, 
  index, 
  isCurrentExercise,
  isActive = false,     
  opacity = 1,         
  scale = 1, 
  onSwipe, 
  onToggleTimer,
  swipeableRef 
}) => {
  const { colors } = useTheme();
  
  // Calculate exercise progress
  const progress = (exercise.completedSets / exercise.sets) * 100;
  const isComplete = exercise.remainingSets === 0;
  

  /**
   * Render right swipe action
   */
  const renderRightActions = (progress, dragX) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
    });
    
    return (
      <View style={styles.swipeAction}>
        <Animated.View style={[styles.swipeIcon, { opacity }]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <Text style={[styles.swipeText, { color: colors.success }]}>Complete</Text>
        </Animated.View>
      </View>
    );
  };
  

  /**
   * Render left swipe action
   */
  const renderLeftActions = (progress, dragX) => {
    const opacity = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
    });
    
    return (
      <View style={styles.swipeAction}>
        <Animated.View style={[styles.swipeIcon, { opacity }]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <Text style={[styles.swipeText, { color: colors.success }]}>Complete</Text>
        </Animated.View>
      </View>
    );
  };
  

  return (
    <Animated.View 
      style={[
        { 
          opacity,
          transform: [{ scale }] 
        }
      ]}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableLeftOpen={onSwipe}
        onSwipeableRightOpen={onSwipe}
        friction={1.2}
        overshootFriction={15}       
        rightThreshold={90}        
        leftThreshold={90}          
        enabled={!exercise.isTimerActive && exercise.remainingSets > 0}
      >
        <Animated.View style={[
          styles.exerciseCard,
          { backgroundColor: colors.background },
          isComplete && styles.completedCard,
          isComplete && {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.divider
          },
          isCurrentExercise && styles.currentExerciseCard,
          isCurrentExercise && {  
            borderColor: colors.primary,
            shadowColor: colors.primary,
          },
          exercise.isTimerActive && styles.activeTimerCard,
          exercise.isTimerActive && {
            backgroundColor: colors.primaryLight,
            shadowColor: colors.primary,
            shadowOpacity: 0.4,              
            shadowRadius: 16,               
            elevation: 12,                   
            transform: [{ scale: 1.03 }],
          }
        ]}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseInfo}>
              <Text style={[
                styles.exerciseName, 
                { color: colors.text },
                isComplete && styles.completedText,
                isComplete && { color: colors.textSecondary }
              ]}>
                {exercise.name}
              </Text>
              <Text style={[
                styles.exerciseValue, 
                { color: colors.primary },
                isComplete && styles.completedText,
                isComplete && { color: colors.textSecondary }
              ]}>
                {exercise.reps ? `${exercise.reps} reps` : `${exercise.time} seconds`}
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={[
                  styles.progressTrack,
                  { backgroundColor: colors.backgroundSecondary }
                ]}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${progress}%`, backgroundColor: colors.primary },
                      isComplete && styles.progressComplete,
                      isComplete && { backgroundColor: colors.success }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.setsRemaining,
                  { color: colors.textSecondary }
                ]}>
                  {exercise.completedSets} / {exercise.sets} sets
                </Text>
              </View>
            </View>
            
            {exercise.time && exercise.remainingSets > 0 && (
              <MotiView
                animate={{
                  scale: exercise.isTimerActive && !exercise.isPaused ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: exercise.isTimerActive && !exercise.isPaused,
                }}
              >
                <TouchableOpacity 
                  onPress={onToggleTimer}
                  style={[
                    styles.playButton,
                    { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.primary 
                    },
                    exercise.isTimerActive && !exercise.isPaused && styles.activePlayButton,
                    exercise.isTimerActive && !exercise.isPaused && { 
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 12,
                    }
                  ]}
                >
                  <Ionicons 
                    name={exercise.isTimerActive ? (exercise.isPaused ? "play" : "pause") : "play"} 
                    size={24} 
                    color={exercise.isTimerActive && !exercise.isPaused ? "#fff" : colors.primary} 
                  />
                </TouchableOpacity>
              </MotiView>
            )}
          </View>

          {isComplete && (
            <View style={[
              styles.completeBadge,
              { backgroundColor: colors.success }
            ]}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.completeBadgeText}>Complete</Text>
            </View>
          )}
        </Animated.View>
      </Swipeable>

      {exercise.isTimerActive && exercise.time && (
        <View style={styles.inlineTimerContainer}>
          <CountdownTimer
            duration={exercise.time}
            onComplete={onSwipe}
            isPaused={exercise.isPaused}
            isInline={true}
          />
        </View>
      )}
    </Animated.View>
  );
};


const styles = StyleSheet.create({
  exerciseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
    position: 'relative',
  },
  completedCard: {
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  exerciseName: {
    ...Typography.headline,
  },
  exerciseValue: {
    ...Typography.subhead,
    marginTop: 2,
  },
  completedText: {
    // Dynamic color via props
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressComplete: {
    // Dynamic color via props
  },
  setsRemaining: {
    ...Typography.caption1,
    width: 60,
  },
  completeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  completeBadgeText: {
    ...Typography.caption2,
    color: '#fff',
    marginLeft: 2,
    fontFamily: 'outfit-medium',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  activePlayButton: {
    // Dynamic backgroundColor via props
  },
  swipeAction: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  swipeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeText: {
    ...Typography.caption1,
    marginTop: 2,
  },
  currentExerciseCard: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  activeTimerCard: {
    borderWidth: 0,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  inlineTimerContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
});

export default ExerciseItem;