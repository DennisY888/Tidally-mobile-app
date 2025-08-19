// hooks/useWorkoutPlayback.js

import { useState, useRef, useEffect } from 'react';
import { Animated, Alert } from 'react-native';
import { Audio } from 'expo-av';
import WorkoutSessionService from '../services/WorkoutSessionService';

export const useWorkoutPlayback = (workout, isResuming = false) => {
  const [completeSound, setCompleteSound] = useState();
  const [startSound, setStartSound] = useState();
  
  const [sessionExercises, setSessionExercises] = useState([]);
  const [workoutProgress, setWorkoutProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // --- ROOT FIX: Refs for all state to be saved ---
  const sessionDataRef = useRef({
    exercises: [],
    progress: 0,
    elapsedTime: 0,
    isComplete: false,
  });

  // Keep refs in sync with state
  useEffect(() => {
    sessionDataRef.current.exercises = sessionExercises;
  }, [sessionExercises]);

  useEffect(() => {
    sessionDataRef.current.progress = workoutProgress;
  }, [workoutProgress]);

  useEffect(() => {
    sessionDataRef.current.elapsedTime = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    sessionDataRef.current.isComplete = workoutComplete;
  }, [workoutComplete]);
  // --- END ROOT FIX ---
  

  useEffect(() => {
    const initializeSession = () => {
      const initialExercises = (Array.isArray(workout.exercises) ? workout.exercises : []).map(exercise => ({
        ...exercise,
        // When resuming, these values will be present on the exercise object from params.
        // When starting fresh, these will be undefined, so we default them.
        remainingSets: exercise.remainingSets ?? exercise.sets ?? 0,
        completedSets: exercise.completedSets ?? 0,
        // Always reset transient state to a clean, predictable start
        isTimerActive: false,
        isPaused: false,
      }));
      
      const progressValue = isResuming ? (parseFloat(workout.progress) || 0) : 0;
      const elapsedTimeValue = isResuming ? (parseInt(workout.elapsedTime, 10) || 0) : 0;

      setSessionExercises(initialExercises);
      setWorkoutProgress(progressValue);
      setElapsedTime(elapsedTimeValue);
      progressAnim.setValue(progressValue);
    };

    initializeSession();
    loadSounds();
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    timerRef.current = timer; // Store ref to the timer itself
    
    return () => {
      unloadSounds();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      saveSessionState();
    };
  }, [workout.id, isResuming]); // Dependencies are correct



  
  useEffect(() => {
    updateProgress();
  }, [sessionExercises]);



  // --- ROOT FIX: saveSessionState now reads exclusively from the ref ---
  const saveSessionState = async () => {
    if (sessionDataRef.current.isComplete) return;
    
    const sessionData = {
      workoutId: workout.id,
      workoutTitle: workout.title,
      workoutImageUrl: workout.imageUrl,
      category: workout.category,
      description: workout.description,
      est_time: workout.est_time,
      exercises: sessionDataRef.current.exercises,
      progress: sessionDataRef.current.progress,
      elapsedTime: sessionDataRef.current.elapsedTime,
      isComplete: sessionDataRef.current.isComplete,
      lastAccessedAt: new Date().toISOString()
    };
    
    await WorkoutSessionService.saveSession(sessionData);
  };
  
  /**
   * Load sound effects
   */
  const loadSounds = async () => {
    try {
      const { sound: completeEffect } = await Audio.Sound.createAsync(
        require('../assets/sounds/complete.mp3')
      );
      setCompleteSound(completeEffect);
      
      const { sound: startEffect } = await Audio.Sound.createAsync(
        require('../assets/sounds/start.mp3')
      );
      setStartSound(startEffect);
    } catch (error) {
      console.error('Failed to load sounds', error);
    }
  };
  
  /**
   * Unload sound effects
   */
  const unloadSounds = async () => {
    if (completeSound) {
      await completeSound.unloadAsync();
    }
    if (startSound) {
      await startSound.unloadAsync();
    }
  };
  
  /**
   * Play a sound effect
   * @param {Object} sound - Sound object to play
   */
  const playSound = async (sound) => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  /**
   * Format seconds into MM:SS display
   * @param {number} timeInSeconds - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const updateProgress = () => {
    const currentExercises = sessionDataRef.current.exercises;
    if (!currentExercises.length) return;
    
    const totalSets = currentExercises.reduce((total, ex) => total + parseInt(ex.sets || 0), 0);
    if (totalSets === 0) {
      setWorkoutProgress(1); // If no sets, consider it 100% complete
      return;
    }
    
    const completedSets = currentExercises.reduce((total, ex) => total + (ex.completedSets || 0), 0);
    const newProgress = completedSets / totalSets;
    setWorkoutProgress(newProgress);
    
    Animated.timing(progressAnim, { toValue: newProgress, duration: 300, useNativeDriver: false }).start();
    
    if (completedSets === totalSets) {
      setWorkoutComplete(true);
      playSound(completeSound);
      clearInterval(timerRef.current);
    }
  };
  
  const handleSetComplete = (exerciseName) => {
    setSessionExercises(current => {
      return current.map(ex =>
        ex.name === exerciseName ? {
          ...ex,
          remainingSets: Math.max(0, ex.remainingSets - 1),
          completedSets: (ex.completedSets || 0) + 1,
          isTimerActive: false
        } : ex
      );
    });
  };
  
  /**
   * Toggle exercise timer
   * @param {string} exerciseName - Name of the exercise
   */
  const toggleTimer = (exerciseName) => {
    playSound(startSound);
    
    setSessionExercises(current =>
      current.map(ex => {
        if (ex.name === exerciseName) {
          if (!ex.isTimerActive) {
            // Start timer
            return {
              ...ex,
              isTimerActive: true,
              isPaused: false
            };
          } else {
            // Toggle pause/resume
            return {
              ...ex,
              isPaused: !ex.isPaused
            };
          }
        }
        else {
          return { ...ex, isTimerActive: false, isPaused: false };
        }

      })
    )
  };
  
  /**
   * Manually save the session state
   */
  const saveSession = async () => {
    return await saveSessionState();
  };
  
  return {
    sessionExercises,
    workoutProgress,
    elapsedTime,
    workoutComplete,
    progressAnim,
    formatTime,
    handleSetComplete,
    toggleTimer,
    playSound,
    completeSound,
    startSound,
    saveSession
  };
};