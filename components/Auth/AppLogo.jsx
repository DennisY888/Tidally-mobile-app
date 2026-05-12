// components/Auth/AppLogo.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AppLogo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Ionicons name="water" size={34} color="rgba(0, 217, 255, 0.95)" />
        <Text style={styles.logoText}>TIDALLY</Text>
      </View>
      <Text style={styles.tagline}>
        Discover and Share Amazing Fitness Journeys
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontFamily: 'bebas-neue',        // Phase 2: Bebas Neue display font
    fontSize: 56,                     // Bebas Neue is naturally condensed — 56px reads like Outfit-bold 48px
    color: '#FFFFFF',
    letterSpacing: 5,                 // Bebas Neue needs generous letter-spacing
    marginLeft: 10,
    // Cyan glow — matches design bible --glow-cyan
    textShadowColor: 'rgba(0, 217, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  tagline: {
    fontFamily: 'syne-regular',       // Phase 2: Syne body font
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginHorizontal: 20,
    letterSpacing: 0.6,
    lineHeight: 20,
  },
});

export default AppLogo;