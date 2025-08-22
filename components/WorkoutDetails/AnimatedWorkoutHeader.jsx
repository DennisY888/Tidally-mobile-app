// components/WorkoutDetails/AnimatedWorkoutHeader.jsx

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated'; // Use reanimated
import { Typography } from '../../constants/Colors';

/**
 * Reanimated header for workout details with image and title
 *
 * @param {Object} props - Component props
 * @param {Object} props.workout - The workout data
 * @param {Object} props.animatedHeaderStyle - Reanimated style for header height
 * @param {Object} props.animatedImageStyle - Reanimated style for image opacity
 * @param {Object} props.animatedTitleStyle - Reanimated style for title opacity
 * @returns {React.ReactNode}
 */
const AnimatedWorkoutHeader = ({
  workout,
  animatedHeaderStyle,
  animatedImageStyle,
  animatedTitleStyle,
}) => {
  return (
    <Animated.View style={[styles.header, animatedHeaderStyle]}>
      <Animated.Image
        source={{ uri: workout?.imageUrl }}
        style={[styles.headerImage, animatedImageStyle]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.headerGradient}
      />
      <Animated.View style={[styles.headerTitleContainer, animatedTitleStyle]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {workout.title}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

// Styles remain exactly the same
const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  headerTitleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    ...Typography.title3,
    color: '#fff',
    textAlign: 'center',
  },
});

export default AnimatedWorkoutHeader;