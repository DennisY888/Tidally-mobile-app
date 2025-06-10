// components/Auth/AuthButton.jsx

import React from 'react';
import { Text, Image, Animated, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur'; // Import BlurView for the effect
import { Typography, Shadows } from '../../constants/Colors'; // Import Shadows for consistency

/**
 * Authentication button with a modern "glassmorphism" style and animation support.
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
      <TouchableOpacity onPress={onPress} disabled={isLoading} activeOpacity={0.8} style={styles.touchable}>
        <BlurView intensity={50} tint="light" style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Image
                source={require('./../../assets/images/google.png')} 
                style={styles.googleIcon}
              />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    ...Shadows.medium,
    shadowColor: '#2E5C8A', 
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  googleIcon: { 
    width: 24, 
    height: 24, 
    marginRight: 12 
  },
  buttonText: {
    ...Typography.headline,
    color: '#FFFFFF',
    fontFamily: 'outfit-medium',
  }
});

export default AuthButton;