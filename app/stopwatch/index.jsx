// app/stopwatch/index.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
  Easing
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

export default function Stopwatch() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  
  // State management following existing patterns
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [laps, setLaps] = useState([]);
  
  // Refs following CountdownTimer pattern
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Setup navigation header (following existing pattern)
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, []);
  
  // Timer logic based on existing CountdownTimer implementation but reversed
  useEffect(() => {
    if (isRunning && !isPaused) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - (elapsedTime * 1000);
      }
      
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }, 10); // 10ms for precise timing
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

// for pulsing animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
  
    if (isRunning && !isPaused) {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(1);
    }
  
    return () => pulse.stop();
  }, [isRunning, isPaused]);

  
  // Format time following existing pattern from WorkoutHeader
  const formatTime = useCallback((timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    const centiseconds = Math.floor((timeInSeconds * 100) % 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }, []);

  
  // Start/Stop functionality
  const handleStartStop = useCallback(() => {
    if (!isRunning) {
      // Start timer
      setIsRunning(true);
      setIsPaused(false);
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (!isPaused) {
      // Pause timer
      setIsPaused(true);
      pausedTimeRef.current = elapsedTime;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Resume timer
      setIsPaused(false);
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isRunning, isPaused, elapsedTime]);
  
  // Reset functionality
  const handleReset = useCallback(() => {
    setElapsedTime(0);
    setIsRunning(false);
    setIsPaused(false);
    setLaps([]);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    clearInterval(intervalRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  
  // Lap functionality
  const handleLap = useCallback(() => {
    if (isRunning && !isPaused) {
      const lapTime = elapsedTime;
      const lapNumber = laps.length + 1;
      setLaps(prev => [{ lapNumber, time: lapTime }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isRunning, isPaused, elapsedTime, laps.length]);
  
  // Get button text based on state
  const getButtonText = () => {
    if (!isRunning) return 'Start';
    if (isPaused) return 'Resume';
    return 'Pause';
  };
  
  // Get button icon based on state
  const getButtonIcon = () => {
    if (!isRunning || isPaused) return 'play';
    return 'pause';
  };
  
  const styles = getStyles(colors, isDark);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header following existing pattern */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stopwatch</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Timer Display */}
      <MotiView 
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={styles.timerContainer}
        >
        <View style={styles.circularProgressContainer}>
            <Animated.View 
            style={[
                styles.progressRing,
                { 
                borderColor: colors.primary,
                transform: [{ scale: pulseAnim }] // Add pulsing animation
                }
            ]}
            />
            <View style={styles.timerDisplayContainer}>
            <LinearGradient
                colors={[colors.background, colors.backgroundSecondary]}
                style={styles.timerBackground}
            >
                <Text style={[styles.timeDisplay, { color: colors.text }]}>
                {formatTime(elapsedTime)}
                </Text>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Ready'}
                </Text>
            </LinearGradient>
            </View>
        </View>
        </MotiView>
      
      {/* Control Buttons */}
      <MotiView 
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: 'spring' }}
        style={styles.controlsContainer}
        >
        <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.divider }]}
            onPress={handleReset}
            disabled={!isRunning && elapsedTime === 0}
        >
            <View style={[styles.buttonContent, { opacity: (!isRunning && elapsedTime === 0) ? 0.5 : 1 }]}>
            <Ionicons name="refresh" size={24} color={colors.textSecondary} />
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                Reset
            </Text>
            </View>
        </TouchableOpacity>
        
        <TouchableOpacity
            style={styles.primaryButtonContainer}
            onPress={handleStartStop}
        >
            <LinearGradient
            colors={isRunning && !isPaused ? 
                [colors.warning, colors.error] : 
                [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
            >
            <Ionicons name={getButtonIcon()} size={32} color="#fff" />
            <Text style={styles.primaryButtonText}>
                {getButtonText()}
            </Text>
            </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.divider }]}
            onPress={handleLap}
            disabled={!isRunning || isPaused}
        >
            <View style={[styles.buttonContent, { opacity: (!isRunning || isPaused) ? 0.5 : 1 }]}>
            <Ionicons name="flag" size={24} color={colors.success} />
            <Text style={[styles.secondaryButtonText, { color: colors.success }]}>
                Lap
            </Text>
            </View>
        </TouchableOpacity>
        </MotiView>
      
      {/* Laps List */}
      {laps.length > 0 && (
        <View style={styles.lapsContainer}>
          <Text style={styles.lapsTitle}>Laps</Text>
          <View style={styles.lapsList}>
            {laps.map((lap, index) => (
              <View key={index} style={styles.lapItem}>
                <Text style={styles.lapNumber}>Lap {lap.lapNumber}</Text>
                <Text style={styles.lapTime}>{formatTime(lap.time)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Theme-aware styles following existing pattern
const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 0 : Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.background,
      ...Shadows.small,
    },
    backButton: {
      marginTop: Spacing.lg,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    headerTitle: {
      marginTop: Spacing.lg,
      ...Typography.title1,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 44,
    },
    timerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    circularProgressContainer: {
      width: 280,
      height: 280,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    progressRing: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 4,
      borderStyle: 'dashed',
    },
    timerDisplayContainer: {
      width: 240,
      height: 240,
      borderRadius: 120,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    timerBackground: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 120,
      ...Shadows.medium,
    },
    timeDisplay: {
      fontSize: 48,
      fontFamily: 'outfit-bold',
      textAlign: 'center',
      letterSpacing: -1,
    },
    timeLabel: {
      ...Typography.subhead,
      marginTop: Spacing.xs,
      fontFamily: 'outfit-medium',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      ...Shadows.small,
    },
    primaryButtonContainer: {
      borderRadius: 60,
      ...Shadows.large,
    },
    primaryButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      ...Typography.caption1,
      color: '#fff',
      marginTop: 6,
      fontFamily: 'outfit-bold',
      fontSize: 14,
    },
    secondaryButton: {
      width: 90,
      height: 90,
      borderRadius: 45,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      backgroundColor: colors.background,
      ...Shadows.small,
    },
    buttonContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      ...Typography.caption2,
      marginTop: 4,
      fontFamily: 'outfit-medium',
      fontSize: 12,
    },
    lapsContainer: {
      backgroundColor: colors.background,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      borderRadius: BorderRadius.lg,
      maxHeight: 200,
      ...Shadows.medium,
    },
    lapsTitle: {
      ...Typography.headline,
      color: colors.text,
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      fontFamily: 'outfit-medium',
    },
    lapsList: {
      maxHeight: 150,
    },
    lapItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    lapNumber: {
      ...Typography.subhead,
      color: colors.textSecondary,
    },
    lapTime: {
      ...Typography.subhead,
      color: colors.text,
      fontFamily: 'outfit-bold',
    },
  });