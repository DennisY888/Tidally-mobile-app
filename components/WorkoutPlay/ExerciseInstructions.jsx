// components/WorkoutPlay/ExerciseInstructions.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

/**
 * Instructions card for workout exercises
 * 
 * @returns {React.ReactNode}
 */
const ExerciseInstructions = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        ...Shadows.small 
      }
    ]}>
      <View style={styles.instructionItem}>
        <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          Swipe exercise left or right to complete a set
        </Text>
      </View>
      
      <View style={styles.instructionItem}>
        <Ionicons name="play-circle" size={20} color={colors.primary} />
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          Tap play on timed exercises to start timer
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  instructionText: {
    ...Typography.footnote,
    marginLeft: 8,
  },
});

export default ExerciseInstructions;