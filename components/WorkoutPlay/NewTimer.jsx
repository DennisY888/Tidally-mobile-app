// components/WorkoutPlay/NewTimer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Play, Pause } from 'lucide-react-native';
import { AppState } from 'react-native';

const NewTimer = ({ 
  duration, 
  isRunning, 
  isPaused, 
  onComplete, 
  onToggleTimer, 
  currentSet, 
  totalSets, 
  savedTimeLeft, 
  onUpdate       
}) => {
  const { colors } = useTheme();

  const getInitialTime = () => {
    if (savedTimeLeft !== undefined && savedTimeLeft !== null) {
      return savedTimeLeft;
    }
    return duration;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTime);
  
  const timeLeftRef = useRef(timeLeft);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    const newVal = (savedTimeLeft !== undefined && savedTimeLeft !== null) ? savedTimeLeft : duration;
    setTimeLeft(newVal);
    timeLeftRef.current = newVal;
  }, [duration, currentSet]); 

  useEffect(() => {
    return () => {
      if (onUpdate) {
        onUpdate(timeLeftRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const actuallyRunning = isRunning && !isPaused;
    if (!actuallyRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused]); 

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      const actuallyRunning = isRunning && !isPaused;

      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        if (backgroundTimeRef.current && actuallyRunning) { 
          const inactiveDuration = Math.round((Date.now() - backgroundTimeRef.current) / 1000);
          setTimeLeft(prevTime => {
            const val = Math.max(0, prevTime - inactiveDuration);
            if (onUpdate) onUpdate(val);
            return val;
          });
        }
        backgroundTimeRef.current = null;
      } 
      else if (nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
        if (onUpdate) onUpdate(timeLeftRef.current);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, isPaused]); 

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? ((duration - Math.max(0, timeLeft)) / duration) * 100 : 0;
  const showPauseIcon = isRunning && !isPaused;

  const getTimeColor = () => {
    if (timeLeft <= 0) return colors.success;
    if (timeLeft < 6 && showPauseIcon) return colors.error;
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
            <TouchableOpacity onPress={onToggleTimer} disabled={timeLeft <= 0} className="w-16 h-16 rounded-full items-center justify-center shadow-lg" style={{ backgroundColor: showPauseIcon ? colors.error + '20' : colors.primary }}>
              {showPauseIcon ? <Pause size={28} color={colors.error} /> : <Play size={28} color="#FFF" />}
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