// app/login/index.jsx
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  StyleSheet,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '../../constants/Colors';
import AuthButton from '../../components/Auth/AuthButton';
import AppLogo from '../../components/Auth/AppLogo';
import { useLoginAnimations } from '../../hooks/useLoginAnimations';
import LoginSvg from './../../assets/images/login.svg';

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [isLoading, setIsLoading] = useState(false);
  const { width } = Dimensions.get('window');

  const {
    fadeAnim,
    slideAnim,
    buttonScaleAnim,
    imagePosition,
    animateIn,
    animateButtonPress,
  } = useLoginAnimations(width);

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);

  useEffect(() => {
    animateIn();
  }, [animateIn]);

  const handleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      animateButtonPress();
      const redirectUrl = Linking.createURL('/(tabs)/home');
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [animateButtonPress]);

  return (
    // Phase 1: Deep navy gradient — still recognizably "blue" but much darker/richer
    // Old: #4C87B8 → #629CCB → #7FB1DE (light blue)
    // New: #0D1B2E → #0F2744 → #0A1A38 (deep ocean navy)
    <LinearGradient
      colors={['#0D1B2E', '#0F2744', '#0A1A38']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      {/* Ambient glow blob — top right, subtle cyan */}
      <View style={styles.ambientTopRight} />
      {/* Ambient glow blob — bottom left, subtle navy */}
      <View style={styles.ambientBottomLeft} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            <Animated.View
              style={[
                styles.imageContainer,
                { transform: [{ translateX: imagePosition }] },
              ]}
            >
              <LoginSvg width="100%" height={280} />
            </Animated.View>

            <AppLogo />
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <AuthButton
              onPress={handleLogin}
              isLoading={isLoading}
              buttonScaleAnim={buttonScaleAnim}
            />

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  // Ambient glow blobs — pure Views with no children,
  // positioned absolutely to create atmospheric depth
  ambientTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 59, 107, 0.45)',
    // React Native doesn't support CSS blur on Views directly.
    // This approximates the glow blob effect with a large, soft circle.
    // For true blur, expo-blur BlurView or @react-native-community/blur can be used in Phase 2.
  },
  ambientBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 36,
  },
  bottomSection: {
    marginBottom: 20,
  },
  termsText: {
    ...Typography.footnote,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    letterSpacing: 0.2,
  },
});