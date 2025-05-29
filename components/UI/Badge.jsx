// components/UI/Badge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography } from '../../constants/Colors';

export function Badge({ 
  label, 
  color = 'primary', // 'primary', 'secondary', 'accent', 'success', 'warning', 'error'
  variant = 'filled', // 'filled', 'outlined'
  size = 'medium', // 'small', 'medium'
  style, 
  labelStyle,
  ...props 
}) {
  const getBackgroundColor = () => {
    if (variant === 'outlined') return 'transparent';
    
    switch (color) {
      case 'secondary': return Colors.light.secondaryLight || Colors.light.lightGray;
      case 'accent': return Colors.light.accent;
      case 'success': return Colors.light.success;
      case 'warning': return Colors.light.warning;
      case 'error': return Colors.light.error;
      default: return Colors.light.primaryLight || Colors.light.lightGray;
    }
  };

  const getTextColor = () => {
    if (variant === 'outlined') {
      switch (color) {
        case 'secondary': return Colors.light.secondary;
        case 'accent': return Colors.light.accent;
        case 'success': return Colors.light.success;
        case 'warning': return Colors.light.warning;
        case 'error': return Colors.light.error;
        default: return Colors.light.primary;
      }
    }
    
    switch (color) {
      case 'secondary': return Colors.light.secondary;
      case 'accent': 
      case 'success': 
      case 'warning': 
      case 'error': return Colors.light.background;
      default: return Colors.light.primary;
    }
  };

  const getBorderColor = () => {
    if (variant !== 'outlined') return 'transparent';
    
    switch (color) {
      case 'secondary': return Colors.light.secondary;
      case 'accent': return Colors.light.accent;
      case 'success': return Colors.light.success;
      case 'warning': return Colors.light.warning;
      case 'error': return Colors.light.error;
      default: return Colors.light.primary;
    }
  };

  const getPadding = () => {
    return size === 'small' 
      ? { paddingVertical: 2, paddingHorizontal: 6 }
      : { paddingVertical: 4, paddingHorizontal: 10 };
  };

  const getTypography = () => {
    return size === 'small' ? Typography.caption2 : Typography.caption1;
  };

  return (
    <View
      style={[
        styles.badge,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        style,
      ]}
      {...props}
    >
      <Text style={[getTypography(), { color: getTextColor() }, labelStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});