// app/workout-play/index.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Animated as RNAnimated, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutPlayback } from '../../hooks/useWorkoutPlayback';
import * as Haptics from 'expo-haptics';

import WaveBackground from '../../components/WorkoutPlay/WaveBackground';
import NewExerciseItem from '../../components/WorkoutPlay/NewExerciseItem';
import { X, Clock } from 'lucide-react-native';

export default function WorkoutPlay() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const isResuming = params.isResuming === 'true';

  const {
    isLoading,
    sessionExercises,
    workoutProgress,
    workoutComplete,
    handleSetComplete,
    toggleTimer,
    saveSession 
  } = useWorkoutPlayback(params, isResuming);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const flatListRef = useRef(null);

  // Auto-advance
  useEffect(() => {
    if (!sessionExercises || sessionExercises.length === 0 || workoutComplete) return;
    
    const currentEx = sessionExercises[currentExerciseIndex];
    if (!currentEx || currentEx.remainingSets === 0) {
       const nextIndex = sessionExercises.findIndex((ex, idx) => idx >= currentExerciseIndex && ex.remainingSets > 0);
       if (nextIndex !== -1 && nextIndex !== currentExerciseIndex) {
          setTimeout(() => setCurrentExerciseIndex(nextIndex), 500);
       }
    }
  }, [sessionExercises, currentExerciseIndex, workoutComplete]);

  // Scroll to active
  useEffect(() => {
    if (!workoutComplete && !isLoading && sessionExercises.length > 0) {
      setTimeout(() => {
        if (flatListRef.current) {
          const safeIndex = Math.min(Math.max(0, currentExerciseIndex), sessionExercises.length - 1);
          flatListRef.current.scrollToIndex({
            index: safeIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }
      }, 300);
    }
  }, [currentExerciseIndex, workoutComplete, isLoading]);

  useEffect(() => {
      navigation.setOptions({ headerShown: false });
  }, []);

  const handleExit = async () => {
    if (!workoutComplete) await saveSession();
    router.back();
  };

  // --- PASS INDEX TO HOOK ---
  const onCompleteSet = (exerciseIndex) => {
    handleSetComplete(exerciseIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const onToggleTimer = (exerciseIndex) => { 
    toggleTimer(exerciseIndex); 
  };

  const remainingTime = useMemo(() => {
    if (!sessionExercises) return '0:00';
    let remainingSeconds = 0;
    sessionExercises.forEach((ex, index) => {
        if (index >= currentExerciseIndex) {
            const incompleteSets = ex.sets - (ex.completedSets || 0);
            const durationPerSet = ex.time ? ex.time : (ex.reps || 0) * 2.0; 
            remainingSeconds += durationPerSet * incompleteSets;
        }
    });
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [sessionExercises, currentExerciseIndex]);

  const renderHeader = () => (
    <View className="mb-6 px-4 pt-4">
      <View className="flex-row items-center justify-between mb-2 mt-4">
        <Text className="text-3xl font-bold w-4/5" style={{ color: colors.text }} numberOfLines={2}>
            {params.title || 'Workout'}
        </Text>
        <TouchableOpacity onPress={handleExit} className="flex-row items-center px-3 py-1 rounded-full border" style={{ backgroundColor: colors.background, borderColor: colors.divider }}>
          <X size={14} color={colors.primary} />
          <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>Exit</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
              <Clock size={14} color={colors.textSecondary} />
              <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>{remainingTime} left</Text>
          </View>
      </View>
      <View className="mt-4 w-full h-2 rounded-full" style={{ backgroundColor: colors.primaryLight }}>
        <RNAnimated.View className="h-full rounded-full" style={{ width: `${workoutProgress * 100}%`, backgroundColor: colors.primary }} />
      </View>
      <View className="flex-row justify-between mt-1">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>Progress</Text>
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {sessionExercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0)} of {sessionExercises.reduce((acc, ex) => acc + (ex.sets || 0), 0)} sets
          </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <WaveBackground />
      <SafeAreaView style={styles.safeArea}>
        {workoutComplete ? (
            <View style={styles.completionContainer}>
                 <Text className="text-4xl font-bold" style={{color: colors.primary}}>Workout Complete!</Text>
                 <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} className="mt-6 px-6 py-3 rounded-full" style={{backgroundColor: colors.primary}}>
                    <Text className="text-white font-bold">Finish</Text>
                 </TouchableOpacity>
            </View>
        ) : (
            <FlatList
                ref={flatListRef}
                data={sessionExercises}
                ListHeaderComponent={renderHeader}
                renderItem={({ item, index }) => (
                    <View className="px-4 my-2">
                         <NewExerciseItem
                            exercise={item}
                            isActive={index === currentExerciseIndex}
                            isCompleted={item.remainingSets === 0}
                            onCompleteSet={() => onCompleteSet(index)}
                            onActivate={() => setCurrentExerciseIndex(index)}
                            onToggleTimer={() => onToggleTimer(index)}
                        />
                    </View>
                )}
                keyExtractor={(item, index) => item.id ? item.id + index : `exercise-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true} 
            />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, zIndex: 10, paddingTop: 20 },
    completionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingBottom: 50 },
});