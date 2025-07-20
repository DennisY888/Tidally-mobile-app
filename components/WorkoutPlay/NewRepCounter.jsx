// components/WorkoutPlay/NewRepCounter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Check, Play, Pause } from 'lucide-react-native';

const NewRepCounter = ({ reps, onComplete, currentSet, totalSets }) => {
  const { colors } = useTheme();
  const [completed, setCompleted] = useState(0);
  const [autoRunning, setAutoRunning] = useState(false);
  const completionHandled = useRef(false);
  const isComplete = completed >= reps;

  useEffect(() => {
    setCompleted(0);
    setAutoRunning(false);
    completionHandled.current = false;
  }, [reps, currentSet]);

  useEffect(() => {
    let timer;
    if (autoRunning && completed < reps) {
      timer = setTimeout(() => {
        setCompleted(prev => prev + 1);
      }, 2000); // 2 seconds per rep, as in the template
    }
    return () => clearTimeout(timer);
  }, [autoRunning, completed, reps]);

  useEffect(() => {
    if (isComplete && !completionHandled.current) {
      completionHandled.current = true;
      setAutoRunning(false);
      const timer = setTimeout(() => { onComplete(); }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const incrementRep = () => { if (!isComplete) setCompleted(prev => prev + 1); };
  const toggleAutoMode = () => { if (!isComplete) setAutoRunning(prev => !prev); };
  
  const progress = reps > 0 ? (completed / reps) * 100 : 0;

  return (
    <View className="w-full">
      <View className="relative overflow-hidden rounded-xl shadow-lg border" style={{ backgroundColor: colors.background, borderColor: colors.divider }}>
        <View className="absolute inset-0" style={{ width: `${progress}%`, backgroundColor: colors.primary + '20' }} />
        <View className="relative px-6 py-8">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <View className="px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: colors.primaryLight }}>
                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>SET {currentSet}/{totalSets}</Text>
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-7xl font-bold" style={{ color: colors.text }}>{completed}</Text>
                <Text className="text-3xl mx-1" style={{ color: colors.textSecondary }}>/</Text>
                <Text className="text-4xl font-semibold" style={{ color: colors.textSecondary }}>{reps}</Text>
              </View>
            </View>
            <View className="flex-col space-y-2">
              <TouchableOpacity onPress={toggleAutoMode} disabled={isComplete} className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: autoRunning ? colors.error + '20' : colors.primary }}>
                {autoRunning ? <Pause size={28} color={colors.error} /> : <Play size={28} color="#FFF" />}
              </TouchableOpacity>
              {!autoRunning && !isComplete && (
                  <TouchableOpacity onPress={incrementRep} className="w-16 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primaryLight }}>
                  </TouchableOpacity>
              )}
            </View>
          </View>
          <View className="w-full h-3 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: colors.primaryLight }}>
            <View className="h-full" style={{ width: `${progress}%`, backgroundColor: colors.primary }} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default NewRepCounter;