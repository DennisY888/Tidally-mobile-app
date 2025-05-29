// components/Profile/StatItem.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Shadows, Spacing } from '../../constants/Colors';

/**
 * Animated stat item with icon, value and label
 * 
 * @param {Object} props - Component props
 * @param {number|string} props.value - Stat value to display
 * @param {string} props.label - Description of the stat
 * @param {string} props.icon - Ionicons name
 * @returns {React.ReactNode}
 */
const StatItem = ({ value, label, icon }) => {
  const { colors } = useTheme();
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={icon} size={24} color="#fff" />
      </LinearGradient>
      <Text style={[styles.value, { color: colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    ...Shadows.small,
  },
  value: {
    ...Typography.title3,
    marginBottom: 2,
  },
  label: {
    ...Typography.caption1,
  },
});

export default StatItem;