// components/UI/EmptyState.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../../constants/Colors';

/**
 * Empty state component for displaying when no content is available
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.icon - Ionicon name to use (default: "information-circle-outline")
 * @returns {React.ReactNode}
 */
const EmptyState = ({ message, icon = "information-circle-outline" }) => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.backgroundSecondary,
        }
      ]}
    >
      <Ionicons name={icon} size={40} color={colors.textTertiary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.callout,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

export default EmptyState;