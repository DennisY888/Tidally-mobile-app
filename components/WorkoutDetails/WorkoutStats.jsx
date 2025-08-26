// components/WorkoutDetails/WorkoutStats.jsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BorderRadius, Spacing } from '../../constants/Colors';

/**
 * Workout statistics display component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.workout - The workout data
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {Object} props.colors - Theme colors
 * @returns {React.ReactNode}
 */
const WorkoutStats = ({ workout, isDark, colors }) => {
  /**
   * Calculate total sets in the workout
   * @returns {number} Total sets
   */
  const getTotalSets = () => {
    return workout.exercises.reduce((total, ex) => total + (ex.sets || 0), 0);
  };
  
  /**
   * Calculate average time for the workout
   * @returns {number} Average time in minutes
   */
  const getAverageTime = () => {
    const timeExercises = workout.exercises.filter(ex => ex.time);
    if (timeExercises.length === 0) return 0;
    
    const totalTime = timeExercises.reduce((total, ex) => {
      return total + (ex.time * (ex.sets || 0));
    }, 0);
    
    return Math.round(totalTime / 60); // Convert to minutes
  };
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? colors.backgroundSecondary : colors.backgroundSecondary }
    ]}>
      <View style={styles.statItem}>
        <Ionicons name="time-outline" size={22} color={isDark ? colors.primary : colors.primary} />
        <View style={styles.statTextContainer}>
          <Text style={[styles.statValue, { color: isDark ? colors.text : colors.text }]}>
            {workout.est_time} min
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
            Duration
          </Text>
        </View>
      </View>
      
      <View style={[styles.statDivider, { backgroundColor: isDark ? colors.divider : colors.divider }]} />
      
      <View style={styles.statItem}>
        <Ionicons name="barbell-outline" size={22} color={isDark ? colors.primary : colors.primary} />
        <View style={styles.statTextContainer}>
          <Text style={[styles.statValue, { color: isDark ? colors.text : colors.text }]}>
            {workout.exercises.length}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
            Exercises
          </Text>
        </View>
      </View>
      
      <View style={[styles.statDivider, { backgroundColor: isDark ? colors.divider : colors.divider }]} />
      
      <View style={styles.statItem}>
        <Ionicons name="layers-outline" size={22} color={isDark ? colors.primary : colors.primary} />
        <View style={styles.statTextContainer}>
          <Text style={[styles.statValue, { color: isDark ? colors.text : colors.text }]}>
            {getTotalSets()}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
            Total Sets
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: '70%',
  },
  statTextContainer: {
    marginLeft: Spacing.sm,
  },
  statValue: {
    ...Typography.headline,
  },
  statLabel: {
    ...Typography.caption1,
  },
});

export default WorkoutStats;