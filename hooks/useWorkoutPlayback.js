// hooks/useWorkoutPlayback.js
import { useState, useRef, useEffect } from 'react';
import { Animated, Alert } from 'react-native';
import { Audio } from 'expo-av';
import WorkoutSessionService from '../services/WorkoutSessionService';

/**
 * Custom hook for managing workout playback functionality
 * 
 * @param {Object} workout - The workout data
 * @param {boolean} isResuming - Whether we're resuming an existing session
 * @returns {Object} Workout playback state and methods
 */
export const useWorkoutPlayback = (workout, isResuming = false) => {
  // Sound effects
  const [completeSound, setCompleteSound] = useState();
  const [startSound, setStartSound] = useState();
  
  // State for workout session
  const [sessionExercises, setSessionExercises] = useState([]);
  
  // Track overall progress
  const [workoutProgress, setWorkoutProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  
  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const sessionExercisesRef = useRef([]);
  
  // Load session data if resuming, otherwise initialize fresh session
  useEffect(() => {
    const initializeSession = async () => {
      console.log("----------------------------------------");
      console.log("INITIALIZE SESSION START");
      console.log("Workout ID:", workout.id);
      console.log("Workout Title:", workout.title);
      console.log("Is Resuming:", isResuming);
      console.log("Exercises from params count:", workout.exercises ? workout.exercises.length : 0);
      
      if (isResuming) {
        console.log("RESUMING WORKFLOW STARTED");
        
        // First, check if we have valid exercises in the params
        if (workout.exercises && workout.exercises.length > 0) {
          console.log("✅ Valid exercises found in route params:", workout.exercises.length);
          console.log("First exercise from params:", JSON.stringify(workout.exercises[0], null, 2));
          
          // Transform workout exercises to session exercises with tracking properties if needed
          const resumeExercises = workout.exercises.map(exercise => {
            // If exercise already has session properties, use them
            if ('remainingSets' in exercise && 'completedSets' in exercise) {
              console.log("Exercise already has session properties:", exercise.name);
              return exercise;
            }
            // Otherwise, add session properties
            console.log("Adding session properties to exercise:", exercise.name);
            return {
              ...exercise,
              remainingSets: exercise.sets || 0,
              completedSets: 0,
              isTimerActive: false,
              isPaused: false
            };
          });
          
          console.log("Setting session exercises from params. Count:", resumeExercises.length);
          console.log("First processed exercise:", JSON.stringify(resumeExercises[0], null, 2));
          
          // Ensure progress is a number
          const progressValue = parseFloat(workout.progress) || 0;

          // Ensure elapsedTime is a number
          const elapsedTimeValue = parseInt(workout.elapsedTime, 10) || 0;

          setSessionExercises(resumeExercises);
          setWorkoutProgress(progressValue);
          setElapsedTime(elapsedTimeValue);
          progressAnim.setValue(progressValue);
          
          console.log("Session state updated from params");
        } else {
          console.log("⚠️ No valid exercises in params, falling back to stored session");
          
          // Fallback to stored session if no exercises in params
          const savedSession = await WorkoutSessionService.getSessionByWorkoutId(workout.id);
          console.log("Found saved session:", savedSession ? "YES" : "NO");
          
          if (savedSession && savedSession.exercises && savedSession.exercises.length > 0) {
            console.log("✅ Resuming with saved session exercises. Count:", savedSession.exercises.length);
            console.log("First exercise from saved session:", JSON.stringify(savedSession.exercises[0], null, 2));
            
            setSessionExercises(savedSession.exercises);
            setWorkoutProgress(savedSession.progress || 0);
            setElapsedTime(savedSession.elapsedTime || 0);
            setWorkoutComplete(savedSession.isComplete || false);
            progressAnim.setValue(savedSession.progress || 0);
            
            console.log("Session state updated from saved session");
          } else {
            console.log("❌ No valid saved session found, initializing fresh session");
            initializeFreshSession();
          }
        }
      } else {
        console.log("FRESH SESSION: Not resuming, initializing fresh session");
        initializeFreshSession();
      }
      
      console.log("INITIALIZE SESSION COMPLETE");
      console.log("----------------------------------------");
    };


    const initializeFreshSession = () => {
      console.log("INITIALIZING FRESH SESSION");
      console.log("Workout exercises raw:", workout.exercises ? "Found" : "Not found");
      
      // Defensive check to ensure workout.exercises is an array
      const workoutExercises = Array.isArray(workout.exercises) ? workout.exercises : [];
      console.log("Workout exercises count:", workoutExercises.length);
      
      if (workoutExercises.length === 0) {
        console.warn("⚠️ WARNING: No exercises found in workout");
      }
      
      // Transform workout exercises to session exercises with tracking properties
      const initialExercises = workoutExercises.map(exercise => ({
        ...exercise,
        remainingSets: exercise.sets || 0,
        completedSets: 0,
        isTimerActive: false,
        isPaused: false
      }));
      
      console.log("Initial session exercises created. Count:", initialExercises.length);
      if (initialExercises.length > 0) {
        console.log("First initial exercise:", JSON.stringify(initialExercises[0], null, 2));
      }
      
      // Important: Set the state directly
      setSessionExercises(initialExercises);
      console.log("State updated with initial exercises");
    
      setWorkoutProgress(0);
      setElapsedTime(0);
      setWorkoutComplete(false);
      progressAnim.setValue(0);
      
      console.log("FRESH SESSION INITIALIZATION COMPLETE");
    };

    initializeSession();
    loadSounds();
    
    // Start workout timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      unloadSounds();
      clearInterval(timerRef.current);
      
      // Save session state when unmounting
      saveSessionState();
    };
  }, [workout.id, isResuming]);
  
  // Update progress whenever session exercises change
  useEffect(() => {
    updateProgress();
  }, [sessionExercises]);

  useEffect(() => {
    sessionExercisesRef.current = sessionExercises;
  }, [sessionExercises]);
  
  /**
   * Save the current session state
   */
  const saveSessionState = async () => {
    // Don't save if workout is complete
    if (workoutComplete) return;
    
    // Use the ref to access the latest exercises
    const currentExercises = [...sessionExercisesRef.current];
    
    const sessionData = {
      workoutId: workout.id,
      workoutTitle: workout.title,
      workoutImageUrl: workout.imageUrl,
      category: workout.category,
      description: workout.description,
      est_time: workout.est_time,
      exercises: currentExercises,  // Now using exercises from ref
      progress: workoutProgress,
      elapsedTime: elapsedTime,
      isComplete: workoutComplete,
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
  
  /**
   * Update overall workout progress
   */
  const updateProgress = () => {
    if (!sessionExercises.length) return;
    
    const totalSets = sessionExercises.reduce((total, ex) => total + parseInt(ex.sets || 0), 0);
    if (totalSets === 0) return;
    
    const completedSets = sessionExercises.reduce((total, ex) => total + (ex.completedSets || 0), 0);
    
    const newProgress = (completedSets / totalSets);
    setWorkoutProgress(newProgress);
    
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: newProgress,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    // Check if workout is complete
    if (completedSets === totalSets) {
      setWorkoutComplete(true);
      playSound(completeSound);
      clearInterval(timerRef.current);
      showCompletionAlert();
    }
  };
  
  /**
   * Handle set completion
   * @param {string} exerciseName - Name of the exercise
   */
  const handleSetComplete = (exerciseName) => {
    console.log(`Completing set for exercise: ${exerciseName}`);

    setSessionExercises(current => {
      const updatedExercises = current.map(ex =>
        ex.name === exerciseName ? {
          ...ex,
          remainingSets: Math.max(0, ex.remainingSets - 1),
          completedSets: (ex.completedSets || 0) + 1,
          isTimerActive: false
        } : ex
      );
      
      console.log(`Updated exercises after completing set. Count: ${updatedExercises.length}`);
      return updatedExercises;
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
        return ex;
      })
    );
  };
  
  /**
   * Show workout completion alert
   */
  const showCompletionAlert = () => {
    setTimeout(() => {
      Alert.alert(
        "Workout Complete!",
        `Great job! You've completed the workout in ${formatTime(elapsedTime)}.`,
        [
          { text: "Save and Exit", onPress: () => {} }
        ]
      );
    }, 500);
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
    saveSession  // New function to manually save session
  };
};