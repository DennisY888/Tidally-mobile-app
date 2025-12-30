// components/WorkoutPlay/NewExerciseItem.jsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS, 
  useAnimatedGestureHandler 
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import NewTimer from './NewTimer';
import NewRepCounter from './NewRepCounter';

const NewExerciseItem = ({ 
  exercise, 
  isActive, 
  isCompleted, 
  onCompleteSet, 
  onActivate, 
  onToggleTimer,
  onUpdateData 
}) => {
    const { colors } = useTheme();
    
    const completedSetsCount = exercise.completedSets || 0;
    const currentSetIndex = Math.min(completedSetsCount, exercise.sets - 1);

    const translateX = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const gestureHandler = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startX = translateX.value;
        },
        onActive: (event, ctx) => {
            if (!isActive || isCompleted) return;
            if (event.translationX > 0) {
                translateX.value = event.translationX;
            }
        },
        onEnd: (event) => {
            if (!isActive || isCompleted) return;
            if (event.translationX > 80) {
                runOnJS(onCompleteSet)(currentSetIndex);
            }
            translateX.value = withSpring(0);
        },
    });

    const containerStyle = {
        backgroundColor: isActive ? colors.background : colors.lightGray,
        borderColor: isActive ? colors.primary : 'transparent',
        shadowColor: isActive ? colors.primary : 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isActive ? 0.1 : 0,
        shadowRadius: 15,
        elevation: isActive ? 8 : 0
    };

    return (
        <TouchableOpacity onPress={onActivate} disabled={isActive} activeOpacity={0.8}>
            <View style={[styles.backgroundFill, { backgroundColor: colors.success + '20' }]} />
            
            <PanGestureHandler 
                onGestureEvent={gestureHandler}
                activeOffsetX={[-30, 30]} 
                failOffsetY={[-30, 30]}
            >
                <Animated.View style={animatedStyle}>
                    <View style={[styles.cardContainer, containerStyle]}>
                        <View style={styles.headerRow}>
                            <View style={styles.titleContainer}>
                                <Text style={[styles.exerciseTitle, { color: isActive ? colors.text : colors.textSecondary }]}>
                                    {exercise.name}
                                </Text>
                                <View style={styles.subtitleRow}>
                                    <Text style={[styles.subtitleText, { color: colors.textTertiary }]}>
                                        {exercise.time ? `${exercise.time}s` : `${exercise.reps} reps`}
                                    </Text>
                                    <View style={styles.dotsContainer}>
                                        {Array.from({ length: exercise.sets }).map((_, i) => (
                                            <View 
                                                key={i} 
                                                style={[
                                                    styles.dot, 
                                                    i === currentSetIndex && isActive && !isCompleted ? styles.activeDotScale : {},
                                                    { backgroundColor: i < completedSetsCount ? colors.success : (i === currentSetIndex && isActive) ? colors.primary : colors.divider }
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {isActive && (
                            <View style={styles.contentContainer}>
                                {isCompleted ? (
                                    <View style={styles.completedContainer}>
                                        <Check color={colors.success} size={32}/>
                                        <Text style={[styles.completedText, {color: colors.success}]}>Exercise Complete!</Text>
                                    </View>
                                ) : exercise.time ? (
                                    <NewTimer 
                                        duration={exercise.time} 
                                        savedTimeLeft={exercise.savedTimeLeft}
                                        isRunning={exercise.isTimerActive}
                                        isPaused={exercise.isPaused}
                                        onComplete={() => onCompleteSet(currentSetIndex)}
                                        onToggleTimer={onToggleTimer}
                                        currentSet={currentSetIndex + 1}
                                        totalSets={exercise.sets}
                                        onUpdate={(time) => onUpdateData && onUpdateData({ savedTimeLeft: time })}
                                    />
                                ) : (
                                    <NewRepCounter
                                        reps={exercise.reps}
                                        savedReps={exercise.savedReps}
                                        onComplete={() => onCompleteSet(currentSetIndex)}
                                        currentSet={currentSetIndex + 1}
                                        totalSets={exercise.sets}
                                        onUpdate={(repsCount) => onUpdateData && onUpdateData({ savedReps: repsCount })}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    backgroundFill: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        justifyContent: 'center', alignItems: 'flex-end',
        paddingRight: 24, borderRadius: 12,
    },
    cardContainer: {
        position: 'relative',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleContainer: { flex: 1 },
    exerciseTitle: { fontSize: 18, fontFamily: 'outfit-bold' },
    subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subtitleText: { fontSize: 14, fontFamily: 'outfit' },
    dotsContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    activeDotScale: { transform: [{ scale: 1.5 }] },
    contentContainer: { marginTop: 16 },
    completedContainer: { alignItems: 'center', paddingVertical: 32 },
    completedText: { fontSize: 18, fontFamily: 'outfit-bold', marginTop: 8 },
});

export default NewExerciseItem;