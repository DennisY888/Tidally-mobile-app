import { useState, useCallback } from 'react';
import { Share, Alert, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { showToast, calculateWorkoutDuration } from '../utils/helpers';
import { db } from '../config/FirebaseConfig';
import { useActiveWorkout } from '../context/WorkoutDetailContext';

export const useWorkoutActions = (workout, workoutExercises, setWorkoutExercises, router) => {
  const { user } = useUser();
  const { setPlaybackWorkout } = useActiveWorkout(); // Context Bridge Access
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);

  const handleShare = useCallback(async () => {
    try {
      if (!workout) return;
      const exercisesList = workout.exercises?.map((exercise, index) => {
        const exerciseDetail = exercise.time 
          ? `${exercise.time}s × ${exercise.sets} sets`
          : `${exercise.reps} reps × ${exercise.sets} sets`;
        return `${index + 1}. ${exercise.name} - ${exerciseDetail}`;
      }).join('\n') || 'No exercises listed';

      const shareMessage = `🏋️ ${workout.title}\n\n💪 Workout Details:\n${exercisesList}\n\n⏱️ Estimated Duration: ${workout.est_time || '?'} minutes\n📂 Category: ${workout.category || 'Uncategorized'}\n\n📱 Created with Tidally`;

      await Share.share({ message: shareMessage });
    } catch (error) { console.error("Error sharing:", error); }
  }, [workout]);
  

  // --- NAVIGATION ---
  const handlePlayWorkout = (exercises) => {
    setPlaybackWorkout({
      ...workout,
      exercises: exercises,
      isResuming: false
    });
    router.push({
      pathname: '/workout-play',
      params: { 
        isResuming: 'false',
        workoutId: workout.id
       }
    });
  };

  const getWorkoutDocRef = async () => {
    if (workout.id) {
       const q = query(collection(db, 'Routines'), where('id', '==', workout.id));
       const querySnapshot = await getDocs(q);
       if (!querySnapshot.empty) {
         return doc(db, 'Routines', querySnapshot.docs[0].id);
       }
    }
    throw new Error("Workout document not found");
  };

  const addExercise = async (newExercise) => {
    try {
      const updatedExercises = [...workoutExercises, newExercise];
      setWorkoutExercises(updatedExercises);
      
      const docRef = await getWorkoutDocRef();
      const newDuration = calculateWorkoutDuration(updatedExercises);
      
      await updateDoc(docRef, {
        exercises: updatedExercises,
        est_time: newDuration,
        lastUpdated: new Date()
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error adding exercise:", error);
    }
  };
  
  const saveEditedExercise = async (editedExercise) => {
    try {
      if (selectedExerciseIndex === undefined || selectedExerciseIndex === null || 
          selectedExerciseIndex < 0 || selectedExerciseIndex >= workoutExercises.length) {
          showToast("Could not identify exercise");
          return false;
      }
      
      const updatedExercises = JSON.parse(JSON.stringify(workoutExercises));
      updatedExercises[selectedExerciseIndex] = {
        ...updatedExercises[selectedExerciseIndex],
        ...editedExercise,
      };
      
      const docRef = await getWorkoutDocRef();
      const newDuration = calculateWorkoutDuration(updatedExercises);
      
      await updateDoc(docRef, {
        exercises: updatedExercises,
        est_time: newDuration,
        lastUpdated: new Date()
      });
      
      setWorkoutExercises(updatedExercises);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Exercise updated");
      return true; 
    } catch (error) {
      console.error("Error updating exercise:", error);
      showToast("Failed to update exercise");
      return false;
    }
  };
  
  // --- DELETE BY INDEX ---
  const handleDeleteExercise = async () => {
    try {
      if (selectedExerciseIndex === undefined || selectedExerciseIndex === null) return;

      const updatedExercises = workoutExercises.filter((_, index) => index !== selectedExerciseIndex);
      
      const docRef = await getWorkoutDocRef();
      const newDuration = calculateWorkoutDuration(updatedExercises);
      
      await updateDoc(docRef, {
        exercises: updatedExercises,
        est_time: newDuration,
        lastUpdated: new Date()
      });
      
      setWorkoutExercises(updatedExercises);
      setSelectedExerciseIndex(null);
      
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