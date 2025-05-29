// components/UI/SectionHeader.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../constants/Colors';

/**
 * Section header component with optional "See All" action
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title text to display
 * @param {Function} props.onSeeAll - Handler for "See All" press
 * @param {boolean} props.showSeeAll - Whether to show the "See All" button (default: true)
 * @returns {React.ReactNode}
 */
const SectionHeader = ({ title, onSeeAll, showSeeAll = true }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title2,
  },
  seeAllText: {
    ...Typography.subhead,
  },
});

export default SectionHeader;