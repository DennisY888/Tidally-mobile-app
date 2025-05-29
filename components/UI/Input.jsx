// components/UI/Input.jsx
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  leftIcon,
  rightIcon,
  errorMessage,
  helperText,
  multiline,
  numberOfLines = 1,
  disabled = false,
  style,
  inputStyle,
  labelStyle,
  containerStyle,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const passwordIcon = isPasswordVisible ? 'eye-off-outline' : 'eye-outline';

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getBorderColor = () => {
    if (errorMessage) return Colors.light.error;
    if (isFocused) return Colors.light.primary;
    return Colors.light.divider;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text 
          style={[
            styles.label, 
            disabled && styles.disabledLabel,
            labelStyle
          ]}
        >
          {label}
        </Text>
      )}
      
      <View 
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: disabled ? Colors.light.lightGray : Colors.light.background,
          },
          multiline && { height: 20 * Math.max(2, numberOfLines) },
          style
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          style={[
            styles.input,
            Typography.body,
            { color: disabled ? Colors.light.textTertiary : Colors.light.text },
            leftIcon && { paddingLeft: 0 },
            (rightIcon || secureTextEntry) && { paddingRight: 0 },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility} 
            style={styles.rightIcon}
          >
            <Ionicons 
              name={passwordIcon} 
              size={20} 
              color={Colors.light.textTertiary} 
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {(errorMessage || helperText) && (
        <Text 
          style={[
            styles.helperText,
            errorMessage && styles.errorText
          ]}
        >
          {errorMessage || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...Typography.subhead,
    color: Colors.light.text,
    marginBottom: 6,
  },
  disabledLabel: {
    color: Colors.light.textTertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.light.text,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    paddingRight: 12,
  },
  helperText: {
    ...Typography.caption1,
    color: Colors.light.textTertiary,
    marginTop: 4,
    marginLeft: 2,
  },
  errorText: {
    color: Colors.light.error,
  },
});