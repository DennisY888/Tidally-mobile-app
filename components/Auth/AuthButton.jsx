// components/Auth/AuthButton.jsx
import React from 'react';
import { View, Text, Pressable, Image, Animated, StyleSheet } from 'react-native';
import { Typography } from '../../constants/Colors';

/**
 * Authentication button with animation support
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onPress - Button press handler
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {Animated.Value} props.buttonScaleAnim - Animation value for button scale
 * @returns {React.ReactNode}
 */
const AuthButton = ({ onPress, isLoading, buttonScaleAnim }) => {
  return (
    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.9 : 1 }
        ]}
      >
        <Image
          source={require('./../../assets/images/google.png')}
          style={styles.googleIcon}
        />
        <Text style={styles.buttonText}>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  googleIcon: { 
    width: 24, 
    height: 24, 
    marginRight: 12 
  },
  buttonText: {
    ...Typography.headline,
    color: '#4C87B8',
  }
});

export default AuthButton;