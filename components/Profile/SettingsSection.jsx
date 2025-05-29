// components/Profile/SettingsSection.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

/**
 * Section container for grouped settings options
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {React.ReactNode} props.children - Settings options to render
 * @returns {React.ReactNode}
 */
const SettingsSection = ({ title, children }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View style={[
        styles.content, 
        { 
          backgroundColor: colors.background,
          ...Shadows.small 
        }
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.subhead,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  content: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});

export default SettingsSection;