// utils/helpers.js

import { Platform, Alert, ToastAndroid } from 'react-native';

/**
 * A reusable, cross-platform function to show a short message to the user.
 * This is the single source of truth for all simple notifications in the app.
 * @param {string} message - The message to display.
 */
export const showToast = (message) => {
  if (Platform.OS === 'android') {
    // This is the line I omitted before. We must import ToastAndroid to use it.
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};


const SECONDS_PER_REP = 3;      // Design Assumption: An average of 3 seconds per repetition.
const SECONDS_OF_REST = 60;     // Design Assumption: A standard 1-minute rest between all sets.

/**
 * Calculates the estimated workout duration in minutes from an array of exercises.
 * @param {Array<Object>} exercises An array of exercise objects { reps, time, sets }.
 * @returns {number} The total estimated duration in whole minutes, always rounded up.
 */
export const calculateWorkoutDuration = (exercises = []) => {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return 0;
  }

  let totalSeconds = 0;
  let totalSets = 0;

  exercises.forEach(exercise => {
    const sets = Number(exercise.sets) || 0;
    totalSets += sets;

    if (exercise.time) {
      totalSeconds += (Number(exercise.time) || 0) * sets;
    } else if (exercise.reps) {
      totalSeconds += (Number(exercise.reps) || 0) * SECONDS_PER_REP * sets;
    }
  });

  // Account for rest time between sets.
  if (totalSets > 1) {
    totalSeconds += (totalSets - 1) * SECONDS_OF_REST;
  }

  // Convert to minutes and round up to the nearest minute.
  const totalMinutes = Math.ceil(totalSeconds / 60);
  
  return totalMinutes;
};