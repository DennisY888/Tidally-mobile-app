// components/WorkoutPlay/NewTimer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Play, Pause } from 'lucide-react-native';
import { AppState } from 'react-native';

const NewTimer = ({ duration, isRunning, onComplete, onToggleTimer, currentSet, totalSets }) => {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(duration);


  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null); 

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration, currentSet]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newTimeLeft = duration - elapsed;

      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        clearInterval(intervalRef.current);
        onComplete();
      }
    }, 250); 

    return () => clearInterval(intervalRef.current);

  }, [isRunning, duration]);


  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // App has come to the foreground
        if (backgroundTimeRef.current && startTimeRef.current) {
          const inactiveDuration = Date.now() - backgroundTimeRef.current;
          startTimeRef.current += inactiveDuration; // Adjust start time to account for background time
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to the background
        backgroundTimeRef.current = Date.now();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);


  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? ((duration - Math.max(0, timeLeft)) / duration) * 100 : 0;
  const getTimeColor = () => {
    if (timeLeft <= 0) return colors.success;
    if (timeLeft < 6 && isRunning) return colors.error;
    return colors.text;
  };

  return (
    <View className="w-full">
      <View className="relative w-full overflow-hidden rounded-2xl shadow-lg border" style={{ backgroundColor: colors.background, borderColor: colors.divider }}>
        <View className="px-6 pt-6 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <View className="px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: colors.primaryLight }}>
                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>SET {currentSet}/{totalSets}</Text>
              </View>
              <Text className="text-6xl font-bold tracking-tighter" style={{ color: getTimeColor() }}>{formatTime(timeLeft)}</Text>
            </View>
            <TouchableOpacity onPress={onToggleTimer} disabled={timeLeft <= 0} className="w-16 h-16 rounded-full items-center justify-center shadow-lg" style={{ backgroundColor: isRunning ? colors.error + '20' : colors.primary }}>
              {isRunning ? <Pause size={28} color={colors.error} /> : <Play size={28} color="#FFF" />}
            </TouchableOpacity>
          </View>
          <View className="flex-row space-x-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} className="flex-1 h-2 rounded-full" style={{ backgroundColor: progress >= (i + 1) * 10 ? colors.primary : colors.primaryLight }}/>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default NewTimer;