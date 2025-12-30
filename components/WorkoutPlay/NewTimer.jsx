// components/WorkoutPlay/NewTimer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.divider }]}>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>SET {currentSet}/{totalSets}</Text>
              </View>
              <Text style={[styles.timerText, { color: getTimeColor() }]}>{formatTime(timeLeft)}</Text>
            </View>
            <TouchableOpacity 
                onPress={onToggleTimer} 
                disabled={timeLeft <= 0} 
                style={[styles.playButton, { backgroundColor: showPauseIcon ? colors.error + '20' : colors.primary }]}
            >
              {showPauseIcon ? <Pause size={28} color={colors.error} /> : <Play size={28} color="#FFF" />}
            </TouchableOpacity>
          </View>
          <View style={styles.dotsRow}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View 
                key={i} 
                style={[
                    styles.progressDot, 
                    { backgroundColor: progress >= (i + 1) * 10 ? colors.primary : colors.primaryLight }
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    card: {
        position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
        borderWidth: 1,
    },
    content: { padding: 24 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
    badgeText: { fontSize: 12, fontFamily: 'outfit-medium' },
    timerText: { fontSize: 60, fontFamily: 'outfit-bold', letterSpacing: -2 },
    playButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.2, elevation: 4 },
    dotsRow: { flexDirection: 'row', gap: 4 },
    progressDot: { flex: 1, height: 8, borderRadius: 4 },
});

export default NewTimer;