// services/WorkoutSessionService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutService } from './WorkoutService';

const STORAGE_KEY = 'tidally_workout_sessions';
const MAX_SAVED_SESSIONS = 4;

/**
 * Service to manage workout session storage
 */
const WorkoutSessionService = {
  /**
   * Get all saved workout sessions
   * @returns {Promise<Array>} Saved sessions sorted by most recent
   */
  getSavedSessions: async () => {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Error getting saved sessions:', error);
      return [];
    }
  },

  /**
   * Save a workout session
   * @param {Object} session - Workout session to save
   * @returns {Promise<boolean>} Whether save was successful
   */
  saveSession: async (session) => {
    console.log("🔍 Saving session - Image URL BEFORE storage:", {
      originalUrl: session.workoutImageUrl,
      hasEncoding: session.workoutImageUrl?.includes('%2F'),
      urlSubstring: session.workoutImageUrl?.substring(50, 150)
    });
    try {
      // Get current sessions
      let sessions = await WorkoutSessionService.getSavedSessions();
      // Add timestamp for sorting
      const sessionWithTimestamp = {
        ...session,
        lastAccessedAt: new Date().toISOString()
      };
      // Remove this workout if it already exists in sessions
      sessions = sessions.filter(s => s.workoutId !== session.workoutId);
      // Add new session at the beginning (most recent)
      sessions.unshift(sessionWithTimestamp);
      // Limit to MAX_SAVED_SESSIONS
      if (sessions.length > MAX_SAVED_SESSIONS) {
        sessions = sessions.slice(0, MAX_SAVED_SESSIONS);
      }
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

      const verifyData = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(verifyData);
      const savedUrl = parsed.find(s => s.workoutId === session.workoutId)?.workoutImageUrl;
      
      console.log("🔍 URL after AsyncStorage save/load:", {
        savedUrl: savedUrl?.substring(50, 150),
        hasEncoding: savedUrl?.includes('%2F'),
        urlsMatch: session.workoutImageUrl === savedUrl
      });

      return true;
    } catch (error) {
      console.error('Error saving workout session:', error);
      return false;
    }
  },

  /**
   * Get a specific workout session by ID
   * @param {string} workoutId - Workout ID to find
   * @returns {Promise<Object|null>} The workout session or null
   */
  getSessionByWorkoutId: async (workoutId) => {
    try {
      const sessions = await WorkoutSessionService.getSavedSessions();
      return sessions.find(session => session.workoutId === workoutId) || null;
    } catch (error) {
      console.error('Error getting workout session:', error);
      return null;
    }
  },

  /**
   * Delete a specific workout session
   * @param {string} workoutId - ID of the workout to delete
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  deleteSession: async (workoutId) => {
    try {
      const sessions = await WorkoutSessionService.getSavedSessions();
      const updatedSessions = sessions.filter(session => session.workoutId !== workoutId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      return true;
    } catch (error) {
      console.error('Error deleting workout session:', error);
      return false;
    }
  },

  /**
   * Clear all saved sessions
   * @returns {Promise<boolean>} Whether clearing was successful
   */
  clearAllSessions: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing workout sessions:', error);
      return false;
    }
  },

  /**
   * Resume a workout session with complete workout data
   * @param {string} workoutId - ID of the workout to resume
   * @returns {Promise<Object>} Session with workout details or null
   */
  resumeSession: async (workoutId) => {
    try {
      // Get session data from storage
      const session = await WorkoutSessionService.getSessionByWorkoutId(workoutId);
      
      if (!session) {
        return null;
      }
      
      // Get the associated workout using WorkoutService
      const workout = await WorkoutService.getWorkoutById(workoutId);
      
      if (!workout) {
        console.error(`Workout ${workoutId} not found in Firestore`);
        return null;
      }
      
      // Return combined data
      return {
        session,
        workout
      };
    } catch (error) {
      console.error('Error resuming session:', error);
      return null;
    }
  }
};

export default WorkoutSessionService;