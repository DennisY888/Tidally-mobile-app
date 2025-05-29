// components/UI/Button.jsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows } from '../../constants/Colors';

export function Button({ 
  title, 
  onPress, 
  variant = 'filled', // 'filled', 'outlined', 'text'
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary', // 'primary', 'secondary', 'accent', 'success', 'warning', 'error'
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  style,
  ...props 
}) {
  const getBackgroundColor = () => {
    if (variant === 'filled') {
      if (disabled) return Colors.light.lightGray;
      
      switch (color) {
        case 'secondary': return Colors.light.secondary;
        case 'accent': return Colors.light.accent;
        case 'success': return Colors.light.success;
        case 'warning': return Colors.light.warning;
        case 'error': return Colors.light.error;
        default: return Colors.light.primary;
      }
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'filled') {
      return disabled ? Colors.light.textTertiary : '#FFFFFF';
    } 
    
    if (disabled) return Colors.light.textTertiary;
    
    switch (color) {
      case 'secondary': return Colors.light.secondary;
      case 'accent': return Colors.light.accent;
      case 'success': return Colors.light.success;
      case 'warning': return Colors.light.warning;
      case 'error': return Colors.light.error;
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
      default: return Colors.light.primary;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'large': return { paddingVertical: 16, paddingHorizontal: 24 };
      default: return { paddingVertical: 12, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return Typography.footnote;
      case 'large': return Typography.headline;
      default: return Typography.subhead;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 1.5 : 0,
          width: fullWidth ? '100%' : undefined,
          ...Shadows.small,
        },
        variant === 'text' && styles.textButton,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[getFontSize(), { color: getTextColor(), textAlign: 'center' }]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});