// components/UI/AnimatedHeader.jsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../constants/Colors';

/**
 * Animated header component with collapsing behavior on scroll
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Header title
 * @param {Animated.Value} props.scrollY - Scroll position for animation
 * @param {Function} props.onBackPress - Back button handler
 * @returns {React.ReactNode}
 */
const AnimatedHeader = ({ title, scrollY, onBackPress }) => {
  const { colors } = useTheme();
  
  // Animation interpolations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [50, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const headerTitleTranslate = scrollY.interpolate({
    inputRange: [50, 100],
    outputRange: [30, 0],
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Animated.Text 
          style={[
            styles.headerTitle,
            { 
              opacity: headerTitleOpacity,
              transform: [{ translateY: headerTitleTranslate }]
            }
          ]}
        >
          {title}
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    justifyContent: 'flex-end',
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.title2,
    color: '#fff',
    marginLeft: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default AnimatedHeader;