// services/WorkoutService.js
import { collection, getDocs, doc, updateDoc, query, where, limit, orderBy, startAfter } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';


export const WorkoutService = {
  /**
   * Fetch workouts with flexible querying options and pagination support
   * 
   * @param {Object} options - Query options
   * @param {string} [options.category] - Filter by category
   * @param {string} [options.userEmail] - Filter by user email
   * @param {number} [options.limit=10] - Number of workouts to fetch
   * @param {Object} [options.lastVisible] - Last document for pagination
   * @param {string} [options.orderByField='createdAt'] - Field to order by
   * @param {string} [options.orderDirection='desc'] - Order direction ('asc' or 'desc')
   * @returns {Promise<Object>} Result with workouts, pagination info, and status
   */
  getWorkouts: async ({ 
    category = null, 
    userEmail = null, 
    limit: resultLimit = 10, 
    lastVisible = null,
    orderByField = 'id', // Changed from 'createdAt' to 'id'
    orderDirection = 'desc'
  }) => {
    try {
      const filters = [];
      
      if (category) {
        filters.push(where('category', '==', category));
      }
      
      if (userEmail) {
        filters.push(where('user.email', '==', userEmail));
      }
      
      filters.push(orderBy(orderByField, orderDirection));
      
      if (lastVisible) {
        filters.push(startAfter(lastVisible));
      }
      
      filters.push(limit(resultLimit));
      
      const q = query(collection(db, 'Routines'), ...filters);
      const snapshot = await getDocs(q);
      
      const workouts = snapshot.docs.map(doc => ({
        ...doc.data(),
        _id: doc.id,
        _ref: doc.ref
      }));
      
      return {
        workouts,
        lastVisible: snapshot.docs.length > 0 ? 
                     snapshot.docs[snapshot.docs.length - 1] : 
                     null,
        isEmpty: snapshot.empty
      };
    } catch (error) {
      console.error("Error fetching workouts:", error);
      return { workouts: [], lastVisible: null, isEmpty: true };
    }
  },
  

  /**
   * Get workout by ID
   * 
   * @param {string} workoutId - Workout ID to fetch
   * @returns {Promise<Object|null>} Workout data or null if not found
   */
  getWorkoutById: async (workoutId) => {
    try {
      const q = query(
        collection(db, 'Routines'),
        where('id', '==', workoutId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return {
        ...snapshot.docs[0].data(),
        _id: snapshot.docs[0].id,
        _ref: snapshot.docs[0].ref
      };
    } catch (error) {
      console.error(`Error fetching workout ${workoutId}:`, error);
      return null;
    }
  },


getAllDocuments: async () => {
  console.log("========== DIAGNOSTIC: WorkoutService.getAllDocuments ==========");
  
  try {
    // Get all documents
    const snapshot = await getDocs(collection(db, 'Routines'));
    
    console.log(`Found ${snapshot.docs.length} total documents in Routines collection`);
    
    // Log detailed info about each document
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nDocument ${index + 1}:`);
      console.log(`- Document ID: ${doc.id}`);
      console.log(`- id field: ${data.id}`);
      console.log(`- category: ${data.category}`);
      console.log(`- title: ${data.title}`);
      console.log(`- exercises: ${data.exercises ? data.exercises.length : 0} exercises`);
      console.log(`- user email: ${data.user?.email}`);
    });
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      _id: doc.id,
      _ref: doc.ref
    }));
  } catch (error) {
    console.error("Error getting all documents:", error);
    console.error("Error details:", error.code, error.message);
    return [];
  } finally {
    console.log("========== END DIAGNOSTIC: WorkoutService.getAllDocuments ==========");
  }
},


searchWorkouts: async (searchTerm) => {
  try {
    // We must search with a lowercase term because our index is lowercase.
    const lowercasedTerm = searchTerm.toLowerCase().trim();

    if (lowercasedTerm === '') {
      return { workouts: [] };
    }

    // This query is highly efficient. It asks Firestore to find all documents
    // where the `searchIndex` array contains the user's search term.
    const q = query(
      collection(db, 'Routines'),
      where('searchIndex', 'array-contains', lowercasedTerm),
      limit(20) // Always limit your search results to prevent huge returns.
    );

    const snapshot = await getDocs(q);

    const workouts = snapshot.docs.map(doc => doc.data());

    return { workouts: workouts };

  } catch (error) {
    // This will catch errors, e.g., if the required index is not built yet.
    console.error("Error searching workouts with Firestore index:", error);
    // It's important to return an empty array so the app doesn't crash.
    return { workouts: [] };
  }
},


  /**
   * Update exercises for a workout
   * 
   * @param {string} workoutId - ID of the workout to update
   * @param {Array} exercises - New exercises array
   * @param {Date} timestamp - Last updated timestamp
   * @returns {Promise<boolean>} Success status
   */
  updateWorkoutExercises: async (workoutId, exercises, timestamp) => {
    try {
      // Find the document by id
      const q = query(collection(db, 'Routines'), where('id', '==', workoutId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }
      
      // Get document reference
      const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
      
      // Update the exercises
      await updateDoc(docRef, {
        exercises: exercises,
        lastUpdated: timestamp
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating workout exercises for ${workoutId}:`, error);
      return false;
    }
  }
};