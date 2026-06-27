// app/login/index.jsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  Share
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth, isClerkAPIResponseError } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

import { Typography } from '../../constants/Colors';
import AuthButton from '../../components/Auth/AuthButton';
import AppLogo from '../../components/Auth/AppLogo';
import { useLoginAnimations } from '../../hooks/useLoginAnimations';
import LoginSvg from './../../assets/images/login.svg'; 

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

// Upper bound on how long we wait for the OAuth round-trip before surfacing a
// retryable error. Set generously so a real human (Google password + 2FA) is
// never cut off, while still guaranteeing the button can't spin forever — the
// exact failure mode where the session never returns to a standalone build.
const OAUTH_TIMEOUT_MS = 120000;

/**
 * Render a structured OAuth-attempt trace as shareable plain text.
 *
 * Why this exists: in a TestFlight/standalone build, console output is not
 * accessible to a non-technical tester. This lets the user export the exact
 * failure details (via the OS share sheet) so the developer can diagnose
 * remotely. `signInStatus`/`signUpStatus` are the decisive fields — they tell
 * us whether the flow timed out (return-leg hang) versus returned without a
 * session (transfer / missing-requirements), which are different root causes.
 *
 * @param {Object} d - diagnostic fields collected during the attempt
 * @returns {string}
 */
function formatDiagnostics(d) {
  return [
    'Tidally sign-in diagnostics',
    `time:             ${d.ts}`,
    `platform:         ${d.platform} ${d.osVersion}`,
    `appVersion:       ${d.appVersion}`,
    `outcome:          ${d.outcome}`,
    `elapsedMs:        ${d.elapsedMs}`,
    `redirectUrl:      ${d.redirectUrl}`,
    `gotSession:       ${d.createdSessionId ? 'yes' : 'no'}`,
    `signInStatus:     ${d.signInStatus ?? 'n/a'}`,
    `signUpStatus:     ${d.signUpStatus ?? 'n/a'}`,
    `errorCode:        ${d.errorCode ?? 'n/a'}`,
    `errorMessage:     ${d.errorMessage ?? 'n/a'}`,
  ].join('\n');
}

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
  
  // Track mount state so we never setState after this screen unmounts.
  // A successful login flips the auth state and the router navigates away,
  // unmounting this component while the async handler may still be settling.
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

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
   * Surface a failed sign-in attempt with a friendly message plus an option to
   * export the full diagnostic trace. Console logs are invisible in TestFlight,
   * so the OS share sheet is how a tester gets the evidence to the developer.
   */
  const reportFailure = useCallback((title, friendlyMessage, diag) => {
    if (!isMountedRef.current) return;
    const details = formatDiagnostics(diag);
    Alert.alert(
      title,
      `${friendlyMessage}\n\nIf this keeps happening, tap “Share details” to send the diagnostic info to the developer.`,
      [
        { text: 'Share details', onPress: () => { Share.share({ message: details }).catch(() => {}); } },
        { text: 'Close', style: 'cancel' },
      ]
    );
  }, []);

  /**
   * Handle Google sign-in.
   *
   * Hardened against the silent "eternal spinner": in a standalone build the
   * OAuth flow can complete on Clerk's servers yet never hand the session back
   * to the app, leaving startOAuthFlow pending indefinitely. We cap the wait,
   * collect a structured trace of every outcome, and surface a retryable,
   * shareable error so the user is never stranded and we always get evidence.
   */
  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    animateButtonPress();

    const startedAt = Date.now();
    // Keep the original redirect target unchanged for this diagnostic build, so we
    // measure Grace's real failure without altering the flow under test. (The
    // app-specific scheme + a clean callback path are deferred to the production
    // migration.) WebBrowser intercepts this redirect, so it needs no matching
    // screen — post-auth navigation is driven by app/index.
    const redirectUrl = Linking.createURL('/(tabs)/home');

    // Mutable trace, filled in as the attempt progresses; exported on failure.
    const diag = {
      ts: new Date().toISOString(),
      platform: Platform.OS,
      osVersion: String(Platform.Version),
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      redirectUrl,
      elapsedMs: 0,
      outcome: 'pending',
      createdSessionId: null,
      signInStatus: undefined,
      signUpStatus: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    };

    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      // Close any auth browser still presented (no-op if already dismissed).
      WebBrowser.dismissAuthSession?.();
      diag.outcome = 'timeout';
      diag.elapsedMs = Date.now() - startedAt;
      if (isMountedRef.current) setIsLoading(false);
      reportFailure(
        'Sign-in timed out',
        'We couldn’t finish signing in with Google in time. Please check your connection and try again.',
        diag
      );
    }, OAUTH_TIMEOUT_MS);

    try {
      const { createdSessionId, setActive, signIn, signUp } =
        await startOAuthFlow({ redirectUrl });

      if (didTimeout) return; // timeout path already handled UI; ignore late result

      diag.elapsedMs = Date.now() - startedAt;
      diag.createdSessionId = createdSessionId ?? null;
      diag.signInStatus = signIn?.status;
      diag.signUpStatus = signUp?.status;

      if (createdSessionId) {
        diag.outcome = 'session';
        await setActive({ session: createdSessionId });
        return; // auth state flips; router navigates away (leave button disabled).
      }

      // Returned without a session: either the user dismissed the browser, or the
      // flow needs an extra step (transfer / missing requirements). In every case
      // the user is NOT signed in — surface it with the captured status so we can
      // tell which case it was.
      diag.outcome = 'no_session';
      if (isMountedRef.current) setIsLoading(false);
      reportFailure(
        'Sign-in didn’t complete',
        'Google didn’t return a session. Please try again.',
        diag
      );
    } catch (err) {
      if (didTimeout) return;
      diag.outcome = 'error';
      diag.elapsedMs = Date.now() - startedAt;
      if (isClerkAPIResponseError(err)) {
        const first = err.errors?.[0];
        diag.errorCode = first?.code;
        diag.errorMessage = first?.longMessage || first?.message;
      } else {
        diag.errorMessage = err instanceof Error ? err.message : String(err);
      }
      console.error('OAuth error:', diag.errorMessage);
      if (isMountedRef.current) setIsLoading(false);
      reportFailure(
        'Sign-in failed',
        'Something went wrong signing in with Google. Please try again.',
        diag
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }, [animateButtonPress, startOAuthFlow, reportFailure]);

  return (
    <LinearGradient
      colors={['#4C87B8', '#629CCB', '#7FB1DE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
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
              <LoginSvg
                width="100%"
                height={300}
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
    marginBottom: 40,
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