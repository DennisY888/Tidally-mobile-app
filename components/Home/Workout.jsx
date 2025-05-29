// components/Home/Workout.jsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet,
  Animated,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import MarkFav from './../../components/MarkFav';

export default function Workout({ workout }) {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Get the difficulty level based on estimated time (just an example)
  const getDifficultyLevel = () => {
    const time = parseInt(workout?.est_time) || 0;
    if (time < 20) return { level: 'Beginner', color: Colors.light.success };
    if (time < 40) return { level: 'Intermediate', color: Colors.light.warning };
    return { level: 'Advanced', color: Colors.light.error };
  };
  
  const difficulty = getDifficultyLevel();
  
  // Count number of exercises
  const exerciseCount = workout?.exercises?.length || 0;
  
  // Handle press animation
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  
  const navigateToWorkout = () => {
    router.push({
      pathname: '/workout-details',
      params: {
        ...workout,
        id: workout.id,
        exercises: JSON.stringify(workout.exercises),
        user: JSON.stringify(workout.user)
      }
    });
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={navigateToWorkout}
        style={styles.pressable}
      >
        {/* Workout Image */}
        <View style={styles.imageContainer}>
          {workout?.imageUrl ? (
            <Image
              source={{ uri: workout?.imageUrl }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="fitness" size={40} color={Colors.light.textTertiary} />
            </View>
          )}
          
          {/* Favorite button */}
          <View style={styles.favButton}>
            <MarkFav workout={workout} />
          </View>
          
          {/* Difficulty badge */}
          <View 
            style={[
              styles.difficultyBadge,
              { backgroundColor: difficulty.color }
            ]}
          >
            <Text style={styles.difficultyText}>{difficulty.level}</Text>
          </View>
        </View>
        
        {/* Workout Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {workout?.title || 'Unnamed Workout'}
          </Text>
          
          <View style={styles.statsContainer}>
            {/* Duration */}
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={Colors.light.primary} />
              <Text style={styles.statText}>{workout.est_time} min</Text>
            </View>
            
            {/* Exercise count */}
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={14} color={Colors.light.primary} />
              <Text style={styles.statText}>{exerciseCount} exercises</Text>
            </View>
          </View>
          
          {/* Creator info */}
          {workout?.user?.name && (
            <View style={styles.creatorContainer}>
              {workout?.user?.imageUrl ? (
                <Image 
                  source={{ uri: workout.user.imageUrl }} 
                  style={styles.creatorImage} 
                />
              ) : (
                <View style={styles.creatorImagePlaceholder}>
                  <Text style={styles.creatorInitials}>
                    {workout.user.name.substring(0, 1)}
                  </Text>
                </View>
              )}
              <Text style={styles.creatorName} numberOfLines={1}>
                by {workout.user.name}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  pressable: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
  },
  difficultyText: {
    ...Typography.caption2,
    color: '#fff',
    fontFamily: 'outfit-medium',
  },
  infoContainer: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.headline,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    ...Typography.caption1,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorImagePlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  creatorInitials: {
    ...Typography.caption2,
    color: '#fff',
    fontFamily: 'outfit-medium',
  },
  creatorName: {
    ...Typography.caption1,
    color: Colors.light.textTertiary,
    flex: 1,
  },
});