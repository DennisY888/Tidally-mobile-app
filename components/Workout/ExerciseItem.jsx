// components/Workout/ExerciseItem.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

/**
 * Exercise item component displaying details of an exercise
 * 
 * @param {Object} props - Component props
 * @param {Object} props.exercise - Exercise data
 * @param {number} props.index - Index for animation delay
 * @param {Function} props.onLongPress - Handler for long press (removal)
 * @returns {React.ReactNode}
 */
const ExerciseItem = ({ exercise, index, onLongPress }) => {
  const { colors } = useTheme();
  
  // Determine which icon to show based on exercise type
  const iconName = exercise.reps ? "barbell-outline" : "timer-outline";
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100, type: 'timing' }}
    >
      <TouchableOpacity 
        style={[
          styles.container,
          { 
            backgroundColor: colors.backgroundSecondary,
          }
        ]}
        onLongPress={onLongPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={iconName} size={20} color={colors.primary} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.name, { color: colors.text }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.details, { color: colors.textSecondary }]}>
            {exercise.reps ? 
              `${exercise.reps} reps` : 
              `${exercise.time} seconds`} • {exercise.sets} sets
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...Typography.subhead,
  },
  details: {
    ...Typography.caption1,
  },
});

export default ExerciseItem;