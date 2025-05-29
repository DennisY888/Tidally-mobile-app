// components/WorkoutPlay/WorkoutHeader.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

/**
 * Header component for workout play screen
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Workout title
 * @param {number} props.elapsedTime - Elapsed time in seconds
 * @param {Animated.Value} props.progressValue - Animated progress value
 * @param {number} props.progressPercent - Progress percentage
 * @param {Function} props.onBack - Back button handler
 * @returns {React.ReactNode}
 */
const WorkoutHeader = ({ 
  title, 
  elapsedTime, 
  progressValue, 
  progressPercent, 
  onBack 
}) => {
  const { colors } = useTheme();
  
  /**
   * Format seconds into MM:SS display
   * @param {number} timeInSeconds - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>Workout in progress</Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={18} color="#fff" />
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              { 
                width: progressValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}% complete</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    ...Typography.headline,
    color: '#fff',
  },
  headerSubtitle: {
    ...Typography.caption1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    ...Typography.subhead,
    color: '#fff',
    marginLeft: 4,
  },
  progressBarContainer: {
    paddingHorizontal: Spacing.lg,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    ...Typography.caption1,
    color: '#fff',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default WorkoutHeader;