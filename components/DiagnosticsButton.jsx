// components/DiagnosticsButton.jsx
//
// Small, unobtrusive floating button (temporary, for tester/TestFlight builds)
// that lets a non-technical user export a diagnostics report via the native
// share sheet. It reads live auth (Clerk) + network (NetworkContext) state and
// delegates formatting/sharing to DiagnosticsService. Purely additive: it
// overlays the app and changes nothing about existing screens.
//
// Pinned top-right; on the login screen (where the known auth issue occurs) the
// corner is clear. To hide it once auth is fixed, remove <DiagnosticsButton />
// from app/_layout.jsx.

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNetwork } from '../context/NetworkContext';
import { shareReport } from '../services/DiagnosticsService';

export default function DiagnosticsButton() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();
  const { user } = useUser();
  const network = useNetwork();

  const onPress = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* haptics optional */ }
    await shareReport({
      auth: { isLoaded, isSignedIn, userId, sessionId },
      user: { email: user?.primaryEmailAddress?.emailAddress },
      network,
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel="Share diagnostics"
      hitSlop={8}
      style={[styles.button, { top: insets.top + 6 }]}
    >
      <Ionicons name="bug-outline" size={18} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
});
