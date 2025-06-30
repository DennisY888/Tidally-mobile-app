// components/Profile/SettingsOption.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../constants/Colors';

/**
 * Settings option item with icon and optional switch
 * 
 * @param {Object} props - Component props
 * @param {string} props.icon - Ionicons name
 * @param {string} props.title - Option title
 * @param {Function} props.onPress - Handler for press/switch change
 * @param {boolean} props.value - Value for switch (if type is 'switch')
 * @param {string} props.type - Type of option ('navigate' or 'switch')
 * @param {string} props.color - Icon color
 * @returns {React.ReactNode}
 */
const SettingsOption = ({ 
  icon, 
  title, 
  onPress, 
  value, 
  type = 'navigate', 
  color
}) => {
  const { colors } = useTheme();
  
  // Use provided color or default to primary
  const iconColor = color || colors.primary;
  
  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      
      {type === 'navigate' && <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />}
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: colors.lightGray, true: `${colors.primary}80` }}
          thumbColor={value ? colors.primary : colors.background}
          ios_backgroundColor={colors.lightGray}
        />
      )}
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.callout,
  },
});

export default SettingsOption;