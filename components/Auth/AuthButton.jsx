// components/Auth/AuthButton.jsx
import React from 'react';
import {
  Text,
  Image,
  Animated,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

const AuthButton = ({ onPress, isLoading, buttonScaleAnim }) => {
  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: buttonScaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.85}
        style={styles.touchable}
      >
        <View style={styles.glowRing} />
        <BlurView intensity={25} tint="dark" style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#00D9FF" />
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
  wrapper: {
    shadowColor: 'rgba(0, 217, 255, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  touchable: {
    borderRadius: 28,
    overflow: 'visible',
  },
  glowRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.45)',
    zIndex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 21, 37, 0.6)',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  buttonText: {
    fontFamily: 'syne-bold',          // Phase 2: Syne Bold for button label
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1.2,               // Design bible: uppercase labels 0.08–0.1em letter-spacing
    textTransform: 'uppercase',       // Design bible: all CTA buttons uppercase
  },
});

export default AuthButton;