// components/Forms/FormField.jsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../../constants/Colors';

/**
 * Reusable form field component with label and styled input
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Input placeholder
 * @param {Function} props.onChangeText - Text change handler
 * @param {string} [props.value] - Input value
 * @param {string} [props.keyboardType] - Keyboard type
 * @param {Object} [props.inputProps] - Additional input props
 * @returns {React.ReactNode}
 */
const FormField = ({
  label,
  placeholder,
  onChangeText,
  value,
  keyboardType = 'default',
  ...inputProps
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.divider,
            color: colors.text
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        onChangeText={onChangeText}
        value={value}
        keyboardType={keyboardType}
        {...inputProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.subhead,
    marginBottom: Spacing.xs,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Typography.body,
  },
});

export default FormField;