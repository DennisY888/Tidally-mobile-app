// components/WorkoutDetails/AnimatedWorkoutHeader.jsx
import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../constants/Colors';

/**
 * Animated header for workout details with image and title
 * 
 * @param {Object} props - Component props
 * @param {Object} props.workout - The workout data
 * @param {Animated.Value} props.headerHeight - Animation value for header height
 * @param {Animated.Value} props.headerOpacity - Animation value for header opacity
 * @param {Animated.Value} props.headerTitleOpacity - Animation value for title opacity
 * @returns {React.ReactNode}
 */
const AnimatedWorkoutHeader = ({ 
  workout, 
  headerHeight, 
  headerOpacity, 
  headerTitleOpacity 
}) => {
  return (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      <Animated.Image
        source={{ uri: workout?.imageUrl }}
        style={[
          styles.headerImage,
          { opacity: headerOpacity }
        ]}
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.headerGradient}
      />
      
      <Animated.View 
        style={[
          styles.headerTitleContainer,
          { opacity: headerTitleOpacity }
        ]}
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          {workout.title}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

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