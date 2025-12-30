// app/workout-play/index.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  Animated as RNAnimated, 
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutPlayback } from '../../hooks/useWorkoutPlayback';
import * as Haptics from 'expo-haptics';

import WaveBackground from '../../components/WorkoutPlay/WaveBackground';
import NewExerciseItem from '../../components/WorkoutPlay/NewExerciseItem';
import { X, Clock } from 'lucide-react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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
    saveSession,
    updateExerciseData 
  } = useWorkoutPlayback(params, isResuming);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const flatListRef = useRef(null);

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

  const onCompleteSet = (exerciseIndex) => {
    handleSetComplete(exerciseIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (exerciseIndex === currentExerciseIndex) {
        const currentEx = sessionExercises[exerciseIndex];
        const completed = (currentEx.completedSets || 0) + 1;
        const total = currentEx.sets || 0;

        if (completed >= total) {
             const nextIndex = sessionExercises.findIndex((ex, idx) => 
                 idx > exerciseIndex && (ex.completedSets || 0) < (ex.sets || 0)
             );
             if (nextIndex !== -1) {
                 setTimeout(() => {
                     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                     setCurrentExerciseIndex(nextIndex);
                 }, 800);
             }
        }
    }
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
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>
            {params.title || 'Workout'}
        </Text>
        <TouchableOpacity 
            onPress={handleExit} 
            style={[styles.exitButton, { backgroundColor: colors.background, borderColor: colors.divider }]}
        >
          <X size={14} color={colors.primary} />
          <Text style={[styles.exitButtonText, { color: colors.primary }]}>Exit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerInfoRow}>
          <View style={styles.infoItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{remainingTime} left</Text>
          </View>
      </View>
      
      <View style={[styles.progressBarBackground, { backgroundColor: colors.primaryLight }]}>
        <RNAnimated.View 
            style={[
                styles.progressBarFill, 
                { width: `${workoutProgress * 100}%`, backgroundColor: colors.primary }
            ]} 
        />
      </View>
      
      <View style={styles.progressTextRow}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
          <Text style={[styles.progressValue, { color: colors.textSecondary }]}>
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
                 <Text style={[styles.completionTitle, {color: colors.primary}]}>Workout Complete!</Text>
                 <TouchableOpacity 
                    onPress={() => router.replace('/(tabs)/home')} 
                    style={[styles.finishButton, {backgroundColor: colors.primary}]}
                 >
                    <Text style={styles.finishButtonText}>Finish</Text>
                 </TouchableOpacity>
            </View>
        ) : (
            <FlatList
                ref={flatListRef}
                data={sessionExercises}
                ListHeaderComponent={renderHeader}
                renderItem={({ item, index }) => (
                    <View style={styles.itemWrapper}>
                         <NewExerciseItem
                            exercise={item}
                            isActive={index === currentExerciseIndex}
                            isCompleted={item.remainingSets === 0}
                            onCompleteSet={() => onCompleteSet(index)}
                            onActivate={() => setCurrentExerciseIndex(index)}
                            onToggleTimer={() => onToggleTimer(index)}
                            onUpdateData={(data) => updateExerciseData(index, data)}
                        />
                    </View>
                )}
                keyExtractor={(item, index) => `${item.id || 'ex'}-${index}`}
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
    safeArea: { flex: 1, zIndex: 10 }, 
    completionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    completionTitle: { fontSize: 32, fontFamily: 'outfit-bold', marginBottom: 24 },
    finishButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 9999 },
    finishButtonText: { color: '#fff', fontFamily: 'outfit-bold', fontSize: 16 },
    listContent: { paddingBottom: 50 },
    itemWrapper: { paddingHorizontal: 16, marginVertical: 8 },
    
    headerContainer: { marginBottom: 24, paddingHorizontal: 16, paddingTop: 16 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 },
    headerTitle: { fontSize: 24, fontFamily: 'outfit-bold', width: '80%' },
    exitButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1 },
    exitButtonText: { fontSize: 14, fontFamily: 'outfit-medium', marginLeft: 4 },
    headerInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    infoItem: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 14, fontFamily: 'outfit', marginLeft: 4 },
    progressBarBackground: { marginTop: 16, width: '100%', height: 8, borderRadius: 9999, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 9999 },
    progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    progressLabel: { fontSize: 12, fontFamily: 'outfit' },
    progressValue: { fontSize: 12, fontFamily: 'outfit-medium' },
});