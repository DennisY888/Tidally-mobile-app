// components/WorkoutPlay/CompletionBar.jsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

/**
 * Completion bar that appears at the bottom when workout is complete
 * 
 * @returns {React.ReactNode}
 */
const CompletionBar = () => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.success, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Ionicons name="trophy" size={24} color="#fff" />
        <Text style={styles.text}>Workout Complete!</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  text: {
    ...Typography.headline,
    color: '#fff',
    marginLeft: Spacing.sm,
  },
});

export default CompletionBar;