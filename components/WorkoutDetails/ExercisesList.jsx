// components/WorkoutDetails/ExercisesList.jsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';


/**
 * Renders a list of exercises for the workout details screen.
 * @param {Object} props - Component props
 * @param {Array} props.exercises - List of exercises
 * @param {Function} props.onExerciseOptions - Function to call for exercise options
 * @param {Function} props.onAddExercise - Function to add a new exercise
 * @param {boolean} props.isUpdatingOrder - Whether order is being updated
 * @returns {React.ReactNode}
 */
const ExercisesList = ({
  exercises,
  onExerciseOptions,
  onAddExercise,
  isUpdatingOrder,
  onReorderPress, 
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  if (!exercises || exercises.length === 0) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.textSecondary }}>No exercises found for this workout.</Text>
        {/* Add Exercise Button (Even when empty) */}
        <TouchableOpacity
          style={[styles.addExerciseButton, { marginTop: 20 }]}
          onPress={onAddExercise}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addExerciseGradient}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>

      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Exercises</Text>
        <TouchableOpacity style={styles.reorderButton} onPressIn={onReorderPress}>
          <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          <Text style={[styles.reorderButtonText, { color: colors.primary }]}>Re-order</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        keyExtractor={(item, index) => `exercise-${index}`}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          // Ensure item has all required properties to prevent undefined text
          const name = item && item.name ? item.name : "Unnamed Exercise";
          const sets = item && item.sets ? item.sets : 0;
          const reps = item && item.reps ? item.reps : 0;
          const time = item && item.time ? item.time : 0;
          
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isUpdatingOrder}
              // ==================== ROOT FIX START ====================
              onPressIn={() => {
                  onExerciseOptions(item, index);
              }}
              // ===================== ROOT FIX END =====================
              style={[
                styles.exerciseItem,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <View style={[
                styles.exerciseIcon, 
                { backgroundColor: colors.primaryLight }
              ]}>
                <Ionicons 
                  name={item.reps ? "barbell-outline" : "timer-outline"} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {name}
                </Text>
                <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
                  {item.reps ? 
                    `${reps} reps` : 
                    `${time} seconds`} • {sets} sets
                </Text>
              </View>
              
              <View style={styles.exerciseSetContainer}>
                <Text style={[styles.exerciseSets, { color: colors.primary }]}>
                  {sets}
                </Text>
                <Text style={[styles.exerciseSetsLabel, { color: colors.textSecondary }]}>
                  sets
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      
      {/* Add Exercise Button */}
      <TouchableOpacity
        style={styles.addExerciseButton}
        onPressIn={onAddExercise}
        disabled={isUpdatingOrder}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addExerciseGradient}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};


const getStyles = (colors, isDark) => StyleSheet.create({
  dragHelpContainer: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dragHelpText: {
    ...Typography.caption1,
    textAlign: 'center',
  },
  draggingItem: {
    transform: [{ scale: 1.02 }],
    ...Shadows.medium
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.headline,
  },
  exerciseDetails: {
    ...Typography.footnote,
    marginTop: 2,
  },
  exerciseSetContainer: {
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  exerciseSets: {
    ...Typography.title3,
  },
  exerciseSetsLabel: {
    ...Typography.caption2,
  },
  dragHandle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addExerciseButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  addExerciseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  addExerciseText: {
    ...Typography.headline,
    color: '#fff',
    marginLeft: Spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listHeaderTitle: {
    ...Typography.title3,
    fontFamily: 'outfit-medium',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  reorderButtonText: {
    ...Typography.subhead,
    fontFamily: 'outfit-medium',
    marginLeft: Spacing.xs,
  },
});

export default ExercisesList;