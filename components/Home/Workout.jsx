// components/Home/Workout.jsx
import React, { useRef, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet,
  Animated,
  Pressable,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { WorkoutService } from '../../services/WorkoutService';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import MarkFav from '../MarkFav';
import { useActiveWorkout } from '../../context/WorkoutDetailContext';
import { useTheme } from '../../context/ThemeContext';
import ActionModal from '../UI/ActionModal';


export default function Workout({ workout, layout = "row" }) {

  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const router = useRouter();
  const { setActiveWorkout } = useActiveWorkout();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  
  // Count number of exercises
  const exerciseCount = workout?.exercises?.length || 0;
  

  // Handle press animation
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  

  const navigateToWorkout = () => {
    setActiveWorkout(workout); 
    router.push('/workout-details/' + workout.id);
  };


  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActionModal(true);
  }, []);


  const handleEditWorkout = useCallback(async (newName) => {
    try {
      const success = await WorkoutService.updateWorkoutTitle(
        workout.id,
        newName,
        workout.user?.email
      );
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Failed to update workout name.");
      }
    } catch (error) {
      console.error("Error updating workout:", error);
      Alert.alert("Error", "Failed to update workout name.");
    }
  }, [workout]);
  

  const handleDeleteWorkout = useCallback(async () => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${workout?.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              const success = await WorkoutService.deleteWorkout(
                workout.id, 
                workout.user?.email
              );
              
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Real-time listeners will automatically update the UI
              } else {
                setIsDeleting(false);
                Alert.alert("Error", "Failed to delete workout. Please try again.");
              }
            } catch (error) {
              setIsDeleting(false);
              console.error("Error deleting workout:", error);
              Alert.alert("Error", "Failed to delete workout. Please try again.");
            }
          }
        }
      ]
    );
  }, [workout]);


  const isRowLayout = layout === 'row';
  
  
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
        onLongPress={handleLongPress}
        style={[
          styles.pressable,
          isRowLayout ? styles.rowLayout : styles.gridLayout
        ]}
      >
        {/* Workout Image */}
        <View style={[
          styles.imageContainer,
          isRowLayout ? styles.rowImage : styles.gridImage
        ]}>
          {workout?.imageUrl ? (
            <Image
              source={{ uri: workout?.imageUrl }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="fitness" size={40} color={colors.textTertiary} /> 
            </View>
          )}
          
          {/* Favorite button */}
          <View style={styles.favButton}>
            <MarkFav workout={workout} />
          </View>
        </View>
        
        <View style={[
          styles.infoContainer,
          isRowLayout ? styles.rowInfo : styles.gridInfo
        ]}>
          <Text style={styles.title} numberOfLines={isRowLayout ? 1 : 2}>
            {workout?.title || 'Unnamed Workout'}
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={colors.primary} /> 
              <Text style={styles.statText}>{`${workout?.est_time || '0'} min`}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={14} color={colors.primary} /> 
              <Text style={styles.statText}>{`${exerciseCount || 0} exercises`}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <ActionModal
        visible={showActionModal}
        title="Workout Options"
        message="What would you like to do with this workout?"
        itemName={workout?.title}
        onClose={() => setShowActionModal(false)}
        onEdit={handleEditWorkout}
        onDelete={handleDeleteWorkout}
        showEdit={true}
        showDelete={true}
      />
    </Animated.View>
  );
}


const getStyles = (colors, isDark) => StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background, // ✅ THEME-AWARE
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows[isDark ? 'dark' : 'light'].medium, // ✅ THEME-AWARE SHADOWS
  },
  pressable: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    height: 110,
    width: 110,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary, // ✅ THEME-AWARE
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
    ...Shadows[isDark ? 'dark' : 'light'].small, // ✅ THEME-AWARE SHADOWS
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  title: {
    ...Typography.headline,
    fontSize: 16,
    color: colors.text, // ✅ THEME-AWARE
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
    color: colors.textSecondary, // ✅ THEME-AWARE
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
    backgroundColor: colors.primary, // ✅ THEME-AWARE
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
    color: colors.textTertiary, // ✅ THEME-AWARE
    flex: 1,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  rowImage: {
    height: 110,
    width: 110,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  rowInfo: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },

  // Grid layout styles (for Favorites page)
  gridLayout: {
    flexDirection: 'column',
  },
  gridImage: {
    height: 120,
    width: '100%',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  gridInfo: {
    padding: Spacing.sm,
    minHeight: 80,
  },
});