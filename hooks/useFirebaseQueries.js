// hooks/useFirebaseQueries.js
import { useState } from 'react';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

/**
 * Custom hook for common Firestore queries in the Tidally app
 * 
 * @returns {Object} Object containing query functions and loading state
 */
export const useFirebaseQueries = () => {
  const [loading, setLoading] = useState(false);
  
  /**
   * Fetch workouts by category
   * 
   * @param {string} category - Category to filter by
   * @param {number} limitCount - Maximum number of results to return
   * @returns {Promise<Array>} Array of workout data
   */
  const getWorkoutsByCategory = async (category, limitCount = 10) => {
    setLoading(true);
    
    try {
      const categoryQuery = query(
        collection(db, 'Routines'),
        where('category', '==', category),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(categoryQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching workouts by category:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch workouts created by a specific user
   * 
   * @param {string} userEmail - Email of the user
   * @param {number} limitCount - Maximum number of results to return
   * @returns {Promise<Array>} Array of workout data
   */
  const getUserWorkouts = async (userEmail, limitCount = 5) => {
    setLoading(true);
    
    try {
      if (!userEmail) return [];
      
      const userQuery = query(
        collection(db, 'Routines'),
        where('user.email', '==', userEmail),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(userQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching user workouts:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch popular workouts
   * Note: This is a simplified implementation. In a real app, 
   * you'd track favorites count in the workout document
   * 
   * @param {number} limitCount - Maximum number of results to return
   * @returns {Promise<Array>} Array of workout data
   */
  const getPopularWorkouts = async (limitCount = 5) => {
    setLoading(true);
    
    try {
      const popularQuery = query(
        collection(db, 'Routines'),
        orderBy('createdAt', 'desc'), // Using createdAt as a placeholder for popularity
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(popularQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching popular workouts:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    getWorkoutsByCategory,
    getUserWorkouts,
    getPopularWorkouts
  };
};