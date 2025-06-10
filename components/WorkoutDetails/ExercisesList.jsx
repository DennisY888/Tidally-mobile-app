// components/WorkoutDetails/ExercisesList.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

/**
 * Draggable list of exercises for workout details
 * 
 * @param {Object} props - Component props
 * @param {Array} props.exercises - List of exercises
 * @param {Function} props.onDragEnd - Function to call when drag ends
 * @param {Function} props.onDragStart - Function to call when drag starts
 * @param {Function} props.onExerciseOptions - Function to call for exercise options
 * @param {Function} props.onAddExercise - Function to add a new exercise
 * @param {boolean} props.isUpdatingOrder - Whether order is being updated
 * @returns {React.ReactNode}
 */
const ExercisesList = ({ 
  exercises, 
  onDragEnd, 
  onDragStart, 
  onExerciseOptions, 
  onAddExercise, 
  isUpdatingOrder 
}) => {
  const { colors, isDark } = useTheme();
  
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
      {/* Drag Help Instructions */}
      <View style={styles.dragHelpContainer}>
        <Text style={[styles.dragHelpText, { color: colors.textTertiary }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
          <Text>{" "}Hold and drag an exercise to reorder</Text>
        </Text>
      </View>
      
      {/* Exercise List */}
      <DraggableFlatList
        data={exercises}
        onDragEnd={onDragEnd}
        onDragBegin={onDragStart}
        keyExtractor={(item, index) => `exercise-${index}`}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, drag, isActive, index }) => {
          // Ensure item has all required properties to prevent undefined text
          const name = item && item.name ? item.name : "Unnamed Exercise";
          const sets = item && item.sets ? item.sets : 0;
          const reps = item && item.reps ? item.reps : 0;
          const time = item && item.time ? item.time : 0;
          
          return (
            <ScaleDecorator>
              <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  drag();
                }}
                disabled={isActive || isUpdatingOrder}
                onPress={() => {
                    onExerciseOptions(item, index);
                  }}
                style={[
                  styles.exerciseItem,
                  { backgroundColor: colors.backgroundSecondary },
                  isActive && styles.draggingItem,
                  isActive && { backgroundColor: colors.primaryLight }
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
        
                {/* Drag handle indicator */}
                <View style={styles.dragHandle}>
                  <Ionicons 
                    name="menu" 
                    size={20} 
                    color={isActive ? colors.primary : colors.textTertiary} 
                  />
                </View>
              </TouchableOpacity>
            </ScaleDecorator>
          );
        }}
      />
      
      {/* Add Exercise Button */}
      <TouchableOpacity
        style={styles.addExerciseButton}
        onPress={onAddExercise}
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

const styles = StyleSheet.create({
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
});

export default ExercisesList;