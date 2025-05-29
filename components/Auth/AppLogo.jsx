// components/Auth/AppLogo.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Colors';

/**
 * App logo component with icon and tagline
 * 
 * @returns {React.ReactNode}
 */
const AppLogo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Ionicons name="water" size={40} color="white" />
        <Text style={styles.logoText}>
          TIDALLY
        </Text>
      </View>
      <Text style={styles.tagline}>
        Discover and Share Amazing Fitness Journeys
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center' 
  },
  logoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  logoText: {
    ...Typography.largeTitle,
    fontSize: 48,
    color: 'white',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    marginLeft: 8,
  },
  tagline: {
    fontFamily: 'outfit-medium',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  }
});

export default AppLogo;