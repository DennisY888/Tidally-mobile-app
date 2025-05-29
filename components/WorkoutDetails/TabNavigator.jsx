// components/WorkoutDetails/TabNavigator.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '../../constants/Colors';

/**
 * Tab navigation component for switching between workout views
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onChange - Function to call on tab change
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {Object} props.colors - Theme colors
 * @returns {React.ReactNode}
 */
const TabNavigator = ({ activeTab, onChange, isDark, colors }) => {
  return (
    <View style={[styles.container, { borderBottomColor: isDark ? colors.divider : colors.divider }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'exercises' && styles.activeTab,
          activeTab === 'exercises' && { borderBottomColor: isDark ? colors.primary : colors.primary }
        ]}
        onPress={() => onChange('exercises')}
      >
        <Ionicons 
          name="list" 
          size={18} 
          color={activeTab === 'exercises' ? 
            (isDark ? colors.primary : colors.primary) : 
            (isDark ? colors.textSecondary : colors.textSecondary)} 
        />
        <Text 
          style={[
            styles.tabText,
            { color: isDark ? colors.textSecondary : colors.textSecondary },
            activeTab === 'exercises' && styles.activeTabText,
            activeTab === 'exercises' && { color: isDark ? colors.primary : colors.primary }
          ]}
        >
          Exercises
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'creator' && styles.activeTab,
          activeTab === 'creator' && { borderBottomColor: isDark ? colors.primary : colors.primary }
        ]}
        onPress={() => onChange('creator')}
      >
        <Ionicons 
          name="person" 
          size={18} 
          color={activeTab === 'creator' ? 
            (isDark ? colors.primary : colors.primary) : 
            (isDark ? colors.textSecondary : colors.textSecondary)} 
        />
        <Text 
          style={[
            styles.tabText,
            { color: isDark ? colors.textSecondary : colors.textSecondary },
            activeTab === 'creator' && styles.activeTabText,
            activeTab === 'creator' && { color: isDark ? colors.primary : colors.primary }
          ]}
        >
          Creator
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    // Uses dynamic color in the component
  },
  tabText: {
    ...Typography.subhead,
    marginLeft: Spacing.xs,
  },
  activeTabText: {
    fontFamily: 'outfit-medium',
  },
});

export default TabNavigator;