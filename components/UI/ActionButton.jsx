// components/UI/ActionButton.jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../../constants/Colors';

/**
 * Reusable action button with icon, text and loading state
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {string} props.icon - Ionicons name
 * @param {Function} props.onPress - Press handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {boolean} [props.loading] - Whether to show loading indicator
 * @param {string|Object} [props.color] - Background color (defaults to primary)
 * @param {Object} [props.style] - Additional styles
 * @returns {React.ReactNode}
 */
const ActionButton = ({
  title,
  icon,
  onPress,
  disabled = false,
  loading = false,
  color,
  style
}) => {
  const { colors } = useTheme();
  
  // Use provided color or default to primary
  const buttonColor = color || colors.primary;
  const disabledColor = colors.textTertiary;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? disabledColor : buttonColor },
        style
      ]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color="#fff" 
              style={styles.icon}
            />
          )}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.headline,
    color: '#fff',
  },
});

export default ActionButton;