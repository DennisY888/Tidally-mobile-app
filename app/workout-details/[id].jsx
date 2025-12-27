// app/workout-details/[id].jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Platform, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import MarkFav from '../../components/MarkFav';
import ExercisesList from '../../components/WorkoutDetails/ExercisesList';
import AddExerciseModal from '../../components/WorkoutDetails/AddExerciseModal';
import EditExerciseModal from '../../components/WorkoutDetails/EditExerciseModal';
import WorkoutStats from '../../components/WorkoutDetails/WorkoutStats';
import AnimatedWorkoutHeader from '../../components/WorkoutDetails/AnimatedWorkoutHeader';
import { useWorkoutActions } from '../../hooks/useWorkoutActions';
import { WorkoutService } from '../../services/WorkoutService';
import ExerciseActionSheet from '../../components/WorkoutDetails/ExerciseActionSheet';
import { useActiveWorkout } from '../../context/WorkoutDetailContext';
import WorkoutSessionService from '../../services/WorkoutSessionService';
import ReorderExercisesModal from '../../components/WorkoutDetails/ReorderExercisesModal';

const { height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = height * 0.5;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function WorkoutDetails() {
  const { activeWorkout: workout, setPlaybackWorkout } = useActiveWorkout();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scrollRef = useRef(null);
  const bottomSheetRef = useRef(null);

  const [workoutExercises, setWorkoutExercises] = useState(workout?.exercises || []);
  const [isSaving, setSaving] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isReorderModalVisible, setIsReorderModalVisible] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, HEADER_SCROLL_DISTANCE], [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT], 'clamp'),
  }));
  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], [1, 0.5, 0], 'clamp'),
  }));
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], [0, 0.5, 1], 'clamp'),
  }));

  const { handleShare, addExercise, saveEditedExercise, handleDeleteExercise, setSelectedExerciseIndex } = 
    useWorkoutActions(workout, workoutExercises, setWorkoutExercises, router);

  const handleSaveOrder = async (newlyOrderedExercises) => {
    setWorkoutExercises(newlyOrderedExercises);
    setIsReorderModalVisible(false);
    try {
      const success = await WorkoutService.updateWorkoutExercises(workout.id, newlyOrderedExercises, new Date());
      if (success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else throw new Error("Update failed in service.");
    } catch (error) {
      setWorkoutExercises(workout.exercises);
      Alert.alert("Update Failed", "Could not save your new order. Please try again.");
    }
  };

  const handleStartWorkout = async () => {
    if (!workout) return;
    try {
      await WorkoutSessionService.deleteSession(workout.id);
      
      // Populate Context Bridge
      setPlaybackWorkout({
        ...workout,
        exercises: workoutExercises, 
        isResuming: false
      });
      
      router.push({
        pathname: '/workout-play',
        params: { isResuming: 'false' } 
      });
    } catch (error) {
      console.error("Error starting workout:", error);
    }
  };

  const handleWorkoutDelete = useCallback(async () => {
    if (!workout) return;
    Alert.alert("Delete Workout", `Are you sure you want to delete "${workout.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const success = await WorkoutService.deleteWorkout(workout.id, workout.user?.email);
          if (success) router.back();
          else Alert.alert("Error", "Failed to delete workout.");
      }}
    ]);
  }, [workout, router]);

  const handleExerciseOptions = (exercise, index) => {
    setSelectedExerciseIndex(index);
    bottomSheetRef.current?.present(exercise, index);
  };

  const handleEdit = (exercise, index) => {
    setSelectedExerciseIndex(index);
    setSelectedExercise({ ...exercise });
    setIsEditModalVisible(true);
  };

  useEffect(() => {
    if (!workout) return;
    navigation.setOptions({
      headerTransparent: true, headerTitle: '',
      headerLeft: () => <TouchableOpacity style={styles.headerButton} onPressIn={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity style={[styles.headerButton, styles.deleteButton]} onPressIn={handleWorkoutDelete}><Ionicons name="trash-outline" size={22} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPressIn={handleShare}><Ionicons name="share-outline" size={22} color="#fff" /></TouchableOpacity>
          <View style={styles.favoriteButton}><MarkFav workout={workout} /></View>
        </View>
      ),
    });
  }, [workout, handleWorkoutDelete, handleShare]);

  if (!workout) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.background }]}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <AnimatedWorkoutHeader workout={workout} animatedHeaderStyle={animatedHeaderStyle} animatedImageStyle={animatedImageStyle} animatedTitleStyle={animatedTitleStyle} />
          
          <AnimatedScrollView ref={scrollRef} onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT }]} showsVerticalScrollIndicator={false}>
            <View style={styles.workoutInfo}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{workout.title}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>{workout.category}</Text>
                </View>
              </View>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{workout.description || 'Complete all sets of each exercise with proper form for best results.'}</Text>
              <WorkoutStats workout={workout} isDark={isDark} colors={colors} />
              <View style={styles.exerciseList}>
                <ExercisesList exercises={workoutExercises} onExerciseOptions={handleExerciseOptions} onAddExercise={() => setIsAddModalVisible(true)} isUpdatingOrder={isSaving} onReorderPress={() => setIsReorderModalVisible(true)} />
              </View>
            </View>
          </AnimatedScrollView>
          
          <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
            <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={handleStartWorkout}>
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>

          <AddExerciseModal visible={isAddModalVisible} onClose={() => setIsAddModalVisible(false)} onAdd={addExercise} />
          {isEditModalVisible && selectedExercise && <EditExerciseModal visible={isEditModalVisible} onClose={() => setIsEditModalVisible(false)} exercise={selectedExercise} onSave={async (edited) => { if (await saveEditedExercise(edited)) setIsEditModalVisible(false); }} />}
          <ExerciseActionSheet ref={bottomSheetRef} onEdit={handleEdit} onDelete={handleDeleteExercise} />
          <ReorderExercisesModal visible={isReorderModalVisible} exercises={workoutExercises} onClose={() => setIsReorderModalVisible(false)} onSave={handleSaveOrder} />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center' },
  favoriteButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  scrollContent: { paddingBottom: 100 },
  workoutInfo: { padding: Spacing.lg },
  titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { ...Typography.title1, flex: 1 },
  categoryBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginLeft: Spacing.md },
  categoryText: { ...Typography.caption1, fontFamily: 'outfit-medium' },
  description: { ...Typography.body, marginBottom: Spacing.lg },
  exerciseList: { marginBottom: Spacing.xl },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md, ...Shadows.medium },
  startButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.md },
  startButtonText: { ...Typography.headline, color: '#fff', marginLeft: Spacing.sm },
  deleteButton: { backgroundColor: 'rgba(248, 114, 114, 0.3)', borderWidth: 1, borderColor: 'rgba(248, 114, 114, 0.5)' },
});