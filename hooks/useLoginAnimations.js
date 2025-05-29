// hooks/useLoginAnimations.js
import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * Hook to manage animations for the login screen
 * 
 * @param {number} screenWidth - Width of the screen
 * @returns {Object} Animation values and functions
 */
export const useLoginAnimations = (screenWidth) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const imagePosition = useRef(new Animated.Value(-screenWidth)).current;
  
  /**
   * Animate entrance of login screen elements
   */
  const animateIn = useCallback(() => {
    // Sequence the animations
    Animated.sequence([
      // First fade in and slide up the main content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Then slide in the image from the side
      Animated.timing(imagePosition, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim, imagePosition]);
  
  /**
   * Animate button press
   */
  const animateButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScaleAnim]);
  
  return {
    fadeAnim,
    slideAnim,
    buttonScaleAnim,
    imagePosition,
    animateIn,
    animateButtonPress
  };
};