// components/UI/IconButton.jsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/Colors';

export function IconButton({ 
  icon,
  onPress,
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary', // 'primary', 'secondary', 'accent', 'success', 'warning', 'error', 'default'
  variant = 'filled', // 'filled', 'outlined', 'ghost'
  disabled = false,
  style,
  ...props 
}) {
  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 48;
      default: return 40;
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return Colors.light.lightGray;
    
    if (variant === 'ghost') return 'transparent';
    
    if (variant === 'outlined') return 'transparent';
    
    switch (color) {
      case 'secondary': return Colors.light.secondary;
      case 'accent': return Colors.light.accent;
      case 'success': return Colors.light.success;
      case 'warning': return Colors.light.warning;
      case 'error': return Colors.light.error;
      case 'default': return Colors.light.lightGray;
      default: return Colors.light.primary;
    }
  };

  const getBorderColor = () => {
    if (variant !== 'outlined') return 'transparent';
    if (disabled) return Colors.light.divider;
    
    switch (color) {
      case 'secondary': return Colors.light.secondary;
      case 'accent': return Colors.light.accent;
      case 'success': return Colors.light.success;
      case 'warning': return Colors.light.warning;
      case 'error': return Colors.light.error;
      case 'default': return Colors.light.textTertiary;
      default: return Colors.light.primary;
    }
  };

  const actualSize = getSize();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          width: actualSize,
          height: actualSize,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 1.5 : 0,
        },
        variant === 'ghost' && styles.ghostButton,
        style,
      ]}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
});