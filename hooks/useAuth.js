// hooks/useAuth.js
import { useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

/**
 * Custom hook for handling auth-related operations and user stats
 * 
 * @returns {Object} Auth methods and user statistics
 */
export const useAuth = () => {
  const { user } = useUser();
  const { signOut } = useClerkAuth();
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    favorites: 0,
    completedWorkouts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  /**
   * Fetch user statistics from Firestore
   */
  const fetchUserStats = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const userEmail = user.primaryEmailAddress.emailAddress;
    
    try {
      // Get workouts created by user
      const workoutsQuery = query(
        collection(db, 'Routines'),
        where('user.email', '==', userEmail)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      
      // Get user favorites
      const favoritesQuery = query(
        collection(db, 'Favorites'),
        where('email', '==', userEmail)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      
      // Get completed workouts (assuming you have a collection for this)
      // For now we'll use a placeholder value
      const completedWorkouts = 0;
      
      setUserStats({
        totalWorkouts: workoutsSnapshot.docs.length,
        favorites: favoritesSnapshot.docs[0]?.data()?.favorites?.length || 0,
        completedWorkouts: completedWorkouts
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load user stats when user changes
  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);
  
  return {
    user,
    signOut,
    userStats,
    isLoading,
    refreshStats: fetchUserStats
  };
};