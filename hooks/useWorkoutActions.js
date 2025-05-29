// hooks/useWorkoutActions.js
import { useState } from 'react';
import { Share, Platform, Alert, ToastAndroid } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

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
   * Initiate a chat with the workout creator
   */
  const initiateChat = async() => {
    try {
      // Verify required data exists
      if (!user?.primaryEmailAddress?.emailAddress || !workout?.user?.email || 
          !user?.imageUrl || !user?.fullName || 
          !workout?.user?.imageUrl || !workout?.user?.name) {
        console.error("Missing required user data");
        return;
      }
  
      // Check if it's the user's own workout
      if (user.primaryEmailAddress.emailAddress === workout.user.email) {
        if (Platform.OS === 'android') {
          ToastAndroid.show("This is your own workout", ToastAndroid.SHORT);
        } else {
          Alert.alert("Note", "This is your own workout");
        }
        return;
      }
      
      const docId1 = user.primaryEmailAddress.emailAddress+'_'+workout.user.email;
      const docId2 = workout.user.email+'_'+user.primaryEmailAddress.emailAddress;
      const q = query(collection(db,'Chat'), where('id','in',[docId1,docId2]));
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return router.push({
          pathname: 'chat-details',
          params: {id: querySnapshot.docs[0].id}
        });
      }
  
      // Create new chat document
      await setDoc(doc(db,'Chat',docId1), {
        id: docId1,
        users: [
          {   
            email: user.primaryEmailAddress.emailAddress,
            imageUrl: user.imageUrl,
            name: user.fullName
          },
          {
            email: workout.user.email,
            imageUrl: workout.user.imageUrl,
            name: workout.user.name
          }
        ],
        userIds: [user.primaryEmailAddress.emailAddress, workout.user.email]
      });
      
      return router.push({
        pathname: 'chat-details',
        params: {id: docId1}
      });
    } catch (error) {
      console.error("InitiateChat error:", error);
    }
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
    try {
      // Validate the index
      if (selectedExerciseIndex === undefined || selectedExerciseIndex === null || 
          selectedExerciseIndex < 0 || selectedExerciseIndex >= workoutExercises.length) {
        console.error("Invalid exercise index:", selectedExerciseIndex);
        Alert.alert("Error", "Could not identify which exercise to update");
        return;
      }
      
      // Create a deep copy of the exercises array
      const updatedExercises = JSON.parse(JSON.stringify(workoutExercises));
      
      // Update the exercise at the selected index
      updatedExercises[selectedExerciseIndex] = {
        ...updatedExercises[selectedExerciseIndex],
        ...editedExercise,
      };
      
      // Update local state FIRST
      setWorkoutExercises(updatedExercises);
      
      // Then update Firestore
      const q = query(collection(db, 'Routines'), where('id', '==', workout.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          exercises: updatedExercises
        });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Exercise updated successfully");
      } else {
        throw new Error("Workout document not found");
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
      Alert.alert("Error", "Failed to update exercise: " + error.message);
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
    initiateChat,
    addExercise,
    saveEditedExercise,
    handleDeleteExercise,
    selectedExerciseIndex,
    setSelectedExerciseIndex
  };
};