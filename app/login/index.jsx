// app/login/index.jsx
import React, { useCallback, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Animated, 
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography, Shadows } from '../../constants/Colors';
import AuthButton from '../../components/Auth/AuthButton';
import AppLogo from '../../components/Auth/AppLogo';
import { useLoginAnimations } from '../../hooks/useLoginAnimations';

/**
 * Hook to warm up the WebBrowser for faster auth flows
 */
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Initialize WebBrowser for auth
WebBrowser.maybeCompleteAuthSession();

/**
 * Login Screen
 * 
 * Handles user authentication via OAuth
 */
export default function LoginScreen() {
  // Hooks
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [isLoading, setIsLoading] = useState(false);
  const { width } = Dimensions.get('window');
  
  // Animation values
  const {
    fadeAnim,
    slideAnim,
    buttonScaleAnim,
    imagePosition,
    animateIn,
    animateButtonPress
  } = useLoginAnimations(width);
  
  // Set status bar style for login screen
  useEffect(() => {
    // Login screen always uses light-content
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);
  
  // Start entrance animations
  useEffect(() => {
    animateIn();
  }, [animateIn]);

  /**
   * Handle login button press
   */
  const handleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      animateButtonPress();
      
      // Use simpler URL without extra parameters
      const redirectUrl = Linking.createURL('/(tabs)/home');
      console.log('OAuth redirect URL:', redirectUrl);
      
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });
  
      if (createdSessionId) {
        console.log('Activating session...');
        await setActive({ session: createdSessionId });
        console.log('Session activated:', createdSessionId);
      }
    } catch (err) {
      console.error('OAuth error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [animateButtonPress]);

  return (
    <LinearGradient
      colors={['#4C87B8', '#629CCB', '#7FB1DE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.contentContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Image Container with Animation */}
            <Animated.View 
              style={[
                styles.imageContainer,
                {
                  transform: [{ translateX: imagePosition }],
                }
              ]}
            >
              <Image
                source={require('./../../assets/images/login.png')}
                resizeMode='contain'
                style={styles.loginImage}
              />
            </Animated.View>

            {/* App Logo and Tagline */}
            <AppLogo />
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Google Sign In Button */}
            <AuthButton
              onPress={handleLogin}
              isLoading={isLoading}
              buttonScaleAnim={buttonScaleAnim}
            />

            {/* Terms Text */}
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = {
  gradientContainer: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1 
  },
  contentContainer: { 
    flex: 1, 
    justifyContent: 'space-between', 
    padding: 24,
  },
  topSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imageContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 40,
    ...Shadows.medium
  },
  loginImage: { 
    width: '100%', 
    height: 240 
  },
  bottomSection: { 
    marginBottom: 20 
  },
  termsText: {
    ...Typography.footnote,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  }
};