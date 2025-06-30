// hooks/useWorkoutActions.js
import { useState } from 'react';
import { Share, Platform, Alert, ToastAndroid } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { showToast } from '../utils/helpers';

import { db } from '../config/FirebaseConfig';

/**
 * Custom hook for workout-related actions
 * 
 * @param {Object} workout - The workout data
 * @param {Array} workoutExercises - The current exercises
 * @param {Function} setWorkoutExercises - Function to update exercises state
 * @param {Object} router - The router object for navigation
 * @returns {Object} Methods for various workout actions
 */
export const useWorkoutActions = (workout, workoutExercises, setWorkoutExercises, router) => {
  const { user } = useUser();
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
  
  /**
   * Share the workout with others
   */
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this awesome workout: ${workout.title} on Tidally app!`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };
  
  /**
   * Navigate to workout play screen
   * @param {Array} exercises - The exercises to use in workout
   */
  const handlePlayWorkout = (exercises) => {
    router.push({
      pathname: '/workout-play',
      params: {
        ...workout,
        exercises: JSON.stringify(exercises)
      }
    });
  };

  
  /**
   * Add a new exercise to the workout
   * @param {Object} newExercise - The exercise to add
   */
  const addExercise = async (newExercise) => {
    try {
      // Update local state first
      const updatedExercises = [...workoutExercises, newExercise];
      setWorkoutExercises(updatedExercises);
      
      // Update Firestore
      const q = query(collection(db, 'Routines'), where('id', '==', workout.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          exercises: updatedExercises
        });
        
        // Success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
      Alert.alert("Error", "Failed to add exercise");
    }
  };
  
  /**
   * Save edited exercise
   * @param {Object} editedExercise - The updated exercise
   * @param {number} index - The index of the exercise to update
   */
  const saveEditedExercise = async (editedExercise) => {
    console.log("🔍 saveEditedExercise called, selectedExerciseIndex:", selectedExerciseIndex);
    try {
      // Validate the index
      if (selectedExerciseIndex === undefined || selectedExerciseIndex === null || 
          selectedExerciseIndex < 0 || selectedExerciseIndex >= workoutExercises.length) {
          console.error("Invalid exercise index:", selectedExerciseIndex);
          showToast("Could not identify which exercise to update");
          return false;
      }
      
      // Create a deep copy of the exercises array
      const updatedExercises = JSON.parse(JSON.stringify(workoutExercises));
      
      // Update the exercise at the selected index
      updatedExercises[selectedExerciseIndex] = {
        ...updatedExercises[selectedExerciseIndex],
        ...editedExercise,
      };
      
      const docRef = doc(db, 'Routines', workout.id);
      await updateDoc(docRef, {
        exercises: updatedExercises
      });
      
      // ✅ ONLY UPDATE LOCAL STATE AFTER SUCCESS
      setWorkoutExercises(updatedExercises);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Exercise updated successfully");
      return true; // ✅ RETURN SUCCESS INDICATOR
    } catch (error) {
      console.error("Error updating exercise:", error);
      showToast("Failed to update exercise");
      return false
    }
  };
  
  /**
   * Delete an exercise from the workout
   * @param {Object} exercise - The exercise to delete
   */
  const handleDeleteExercise = async (exercise) => {
    try {
      // Get the document from Firestore
      const q = query(collection(db, 'Routines'), where('id', '==', workout.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
        const workoutData = querySnapshot.docs[0].data();
        
        // Filter out the exercise to delete
        const updatedExercises = workoutData.exercises.filter(ex => 
          ex.name !== exercise.name || 
          ex.reps !== exercise.reps ||
          ex.time !== exercise.time
        );
        
        // Update Firestore
        await updateDoc(docRef, {
          exercises: updatedExercises
        });
        
        // Update local state
        setWorkoutExercises(updatedExercises);
        
        // Show success feedback
        Alert.alert("Success", "Exercise deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      Alert.alert("Error", "Failed to delete exercise");
    }
  };
  
  return {
    handleShare,
    handlePlayWorkout,
    addExercise,
    saveEditedExercise,
    handleDeleteExercise,
    selectedExerciseIndex,
    setSelectedExerciseIndex
  };
};