// components/WorkoutPlay/NewExerciseItem.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import NewTimer from './NewTimer';
import NewRepCounter from './NewRepCounter';

const NewExerciseItem = ({ exercise, isActive, isCompleted, onCompleteSet, onActivate, onToggleTimer }) => {
    const { colors } = useTheme();
    const completedSets = Array(exercise.sets).fill(false).map((_, i) => i < exercise.completedSets);
    const currentSetIndex = completedSets.findIndex(set => !set);

    const translateX = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const onGestureEvent = (event) => {
        if (!isActive || isCompleted || exercise.time) return;
        if (event.translationX > 0) {
            translateX.value = event.translationX;
        }
    };

    const onGestureEnd = (event) => {
        if (event.translationX > 80) {
            runOnJS(onCompleteSet)(currentSetIndex);
        }
        translateX.value = withSpring(0);
    };

    return (
        <TouchableOpacity onPress={onActivate} disabled={isActive} activeOpacity={0.8}>
            <View className="absolute inset-0 items-center justify-end flex-row pr-6 rounded-xl" style={{ backgroundColor: colors.success + '20' }} />
            <PanGestureHandler onGestureEvent={onGestureEvent} onEnded={onGestureEnd} enabled={isActive && !isCompleted && !exercise.time}>
                <Animated.View style={animatedStyle}>
                    <View className={`relative p-4 rounded-xl border-2`} style={{
                        backgroundColor: isActive ? colors.background : colors.lightGray,
                        borderColor: isActive ? colors.primary : 'transparent',
                        shadowColor: isActive ? colors.primary : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isActive ? 0.1 : 0,
                        shadowRadius: 15,
                        elevation: isActive ? 8 : 0
                    }}>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="font-semibold text-lg" style={{ color: isActive ? colors.text : colors.textSecondary }}>{exercise.name}</Text>
                                <View className="flex-row items-center mt-1">
                                <Text className="text-sm" style={{ color: colors.textTertiary }}>
                                    {exercise.time ? `${exercise.time}s` : `${exercise.reps} reps`}
                                </Text>
                                <View className="flex-row items-center ml-3 space-x-1.5">
                                    {Array.from({ length: exercise.sets }).map((_, i) => (
                                    <View key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSetIndex && isActive && !isCompleted ? 'scale-150' : ''}`} style={{
                                        backgroundColor: completedSets[i] ? colors.success : (i === currentSetIndex && isActive) ? colors.primary : colors.divider
                                    }}/>
                                    ))}
                                </View>
                                </View>
                            </View>
                        </View>

                        {isActive && (
                            <View className="mt-4">
                                {isCompleted ? (
                                    <View className="items-center py-8">
                                        <Check color={colors.success} size={32}/>
                                        <Text className="text-lg font-semibold" style={{color: colors.success}}>Exercise Complete!</Text>
                                    </View>
                                ) : exercise.time ? (
                                    <NewTimer 
                                        duration={exercise.time} 
                                        isRunning={exercise.isTimerActive}
                                        isPaused={exercise.isPaused}
                                        onComplete={() => onCompleteSet(currentSetIndex)}
                                        onToggleTimer={onToggleTimer}
                                        currentSet={currentSetIndex + 1}
                                        totalSets={exercise.sets}
                                    />
                                ) : (
                                    <NewRepCounter
                                        reps={exercise.reps}
                                        onComplete={() => onCompleteSet(currentSetIndex)}
                                        currentSet={currentSetIndex + 1}
                                        totalSets={exercise.sets}
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
export default NewExerciseItem;