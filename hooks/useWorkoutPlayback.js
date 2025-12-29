// hooks/useWorkoutPlayback.js
import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import WorkoutSessionService from '../services/WorkoutSessionService';
import { useActiveWorkout } from '../context/WorkoutDetailContext';
import { WorkoutService } from '../services/WorkoutService';

export const useWorkoutPlayback = (params, isResuming = false) => {
  const { playbackWorkout } = useActiveWorkout(); 

  const [completeSound, setCompleteSound] = useState();
  const [startSound, setStartSound] = useState();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [workoutProgress, setWorkoutProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const sessionDataRef = useRef({
    exercises: [],
    progress: 0,
    elapsedTime: 0,
    isComplete: false,
    workoutMeta: {}
  });

  useEffect(() => { sessionDataRef.current.exercises = sessionExercises; }, [sessionExercises]);
  useEffect(() => { sessionDataRef.current.progress = workoutProgress; }, [workoutProgress]);
  useEffect(() => { sessionDataRef.current.elapsedTime = elapsedTime; }, [elapsedTime]);
  useEffect(() => { sessionDataRef.current.isComplete = workoutComplete; }, [workoutComplete]);

  const updateExerciseData = (index, data) => {
    setSessionExercises(current => 
      current.map((ex, i) => i === index ? { ...ex, ...data } : ex)
    );
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      let targetWorkout = playbackWorkout || params;
      let rawExercises = [];

      if (targetWorkout.exercises && Array.isArray(targetWorkout.exercises)) {
        rawExercises = targetWorkout.exercises;
      } 
      else if (targetWorkout.workoutId) {
        try {
          if (params.isResuming === 'true') {
            const sessionData = await WorkoutSessionService.resumeSession(targetWorkout.workoutId);
            if (sessionData && sessionData.session) {
              targetWorkout = { ...sessionData.workout, ...sessionData.session };
              rawExercises = sessionData.session.exercises || [];
            }
          } else {
            const fetched = await WorkoutService.getWorkoutById(targetWorkout.workoutId);
            if (fetched) {
              targetWorkout = fetched;
              rawExercises = fetched.exercises || [];
            }
          }
        } catch (e) { console.error("Rescue fetch failed:", e); }
      } 
      else if (typeof targetWorkout.exercises === 'string') {
         try { rawExercises = JSON.parse(targetWorkout.exercises); } catch (e) {}
      }

      sessionDataRef.current.workoutMeta = {
        id: targetWorkout.id || targetWorkout.workoutId,
        title: targetWorkout.title || targetWorkout.workoutTitle || 'Untitled Workout',
        imageUrl: targetWorkout.imageUrl || targetWorkout.workoutImageUrl,
        category: targetWorkout.category,
        description: targetWorkout.description,
        est_time: targetWorkout.est_time,
      };

      const initialExercises = rawExercises.map(exercise => ({
        ...exercise,
        sets: Number(exercise.sets) || 0,
        reps: Number(exercise.reps) || 0,
        time: Number(exercise.time) || 0,
        remainingSets: exercise.remainingSets ?? (Number(exercise.sets) || 0),
        completedSets: exercise.completedSets ?? 0,
        isTimerActive: false,
        isPaused: false,
        savedTimeLeft: exercise.savedTimeLeft,
        savedReps: exercise.savedReps
      }));

      const progressValue = isResuming ? (parseFloat(targetWorkout.progress) || 0) : 0;
      const elapsedTimeValue = isResuming ? (parseInt(targetWorkout.elapsedTime, 10) || 0) : 0;

      setSessionExercises(initialExercises);
      setWorkoutProgress(progressValue);
      setElapsedTime(elapsedTimeValue);
      progressAnim.setValue(progressValue);
      
      await loadSounds();
      setIsLoading(false);
    };

    initialize();

    const timer = setInterval(() => {
      if (!sessionDataRef.current.isComplete) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
    timerRef.current = timer;

    return () => {
      unloadSounds();
      if (timerRef.current) clearInterval(timerRef.current);
      saveSessionState();
    };
  }, [params.id, isResuming]); 


  useEffect(() => {
    if (!isLoading) updateProgress();
  }, [sessionExercises, isLoading]);

  const saveSessionState = async () => {
    const { isComplete, exercises, progress, elapsedTime, workoutMeta } = sessionDataRef.current;
    if (isComplete || !workoutMeta.id) return;

    const sessionData = {
      workoutId: workoutMeta.id,
      workoutTitle: workoutMeta.title,
      workoutImageUrl: workoutMeta.imageUrl,
      category: workoutMeta.category,
      description: workoutMeta.description,
      est_time: workoutMeta.est_time,
      exercises: exercises, 
      progress: progress,
      elapsedTime: elapsedTime,
      isComplete: isComplete,
      lastAccessedAt: new Date().toISOString()
    };
    
    await WorkoutSessionService.saveSession(sessionData);
  };

  const loadSounds = async () => {
    try {
      const { sound: complete } = await Audio.Sound.createAsync(require('../assets/sounds/complete.mp3'));
      setCompleteSound(complete);
      const { sound: start } = await Audio.Sound.createAsync(require('../assets/sounds/start.mp3'));
      setStartSound(start);
    } catch (e) { console.log('Sound load error', e); }
  };

  const unloadSounds = async () => {
    if (completeSound) await completeSound.unloadAsync();
    if (startSound) await startSound.unloadAsync();
  };

  const playSound = async (sound) => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (e) { console.log('Play sound error', e); }
  };

  
  const handleSetComplete = (exerciseIndex) => {
    setSessionExercises(current => 
      current.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          remainingSets: Math.max(0, ex.remainingSets - 1),
          completedSets: (ex.completedSets || 0) + 1,
          isTimerActive: false,
          isPaused: false,
          savedTimeLeft: ex.time, 
          savedReps: 0           
        } : ex
      )
    );
  };

  const toggleTimer = (exerciseIndex) => {
    playSound(startSound);
    setSessionExercises(current =>
      current.map((ex, i) => {
        if (i === exerciseIndex) {
          return { ...ex, isTimerActive: !ex.isTimerActive, isPaused: false };
        }
        return { ...ex, isTimerActive: false, isPaused: false };
      })
    );
  };

  const updateProgress = () => {
    const currentExercises = sessionDataRef.current.exercises;
    if (!currentExercises.length) return;
    
    const totalSets = currentExercises.reduce((total, ex) => total + (ex.sets || 0), 0);
    if (totalSets === 0) {
      setWorkoutProgress(1);
      return;
    }
    
    const completedSets = currentExercises.reduce((total, ex) => total + (ex.completedSets || 0), 0);
    const newProgress = completedSets / totalSets;
    setWorkoutProgress(newProgress);
    
    Animated.timing(progressAnim, { toValue: newProgress, duration: 300, useNativeDriver: false }).start();
    
    if (completedSets >= totalSets && !workoutComplete) {
      setWorkoutComplete(true);
      playSound(completeSound);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isLoading,
    sessionExercises,
    workoutProgress,
    elapsedTime,
    workoutComplete,
    progressAnim,
    formatTime,
    handleSetComplete,
    toggleTimer,
    saveSession: saveSessionState,
    updateExerciseData 
  };
};