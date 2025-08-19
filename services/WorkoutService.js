// services/WorkoutService.js
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, writeBatch, query, where, limit, orderBy, startAfter } from 'firebase/firestore';
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
      const docRef = doc(db, 'Routines', workoutId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        ...docSnap.data(),
        _id: docSnap.id,
        _ref: docSnap.ref
      };
    } catch (error) {
      console.error(`Error fetching workout ${workoutId}:`, error);
      return null;
    }
  },


getAllDocuments: async () => {
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


searchWorkouts: async (searchTerm, userEmail) => {
    try {
      const lowercasedTerm = searchTerm.toLowerCase().trim();
  
      if (lowercasedTerm === '' || !userEmail) {
        return { workouts: [] };
      }
  
      const q = query(
        collection(db, 'Routines'),
        where('user.email', '==', userEmail), 
        where('searchIndex', 'array-contains', lowercasedTerm),
        limit(20)
      );
  
      const snapshot = await getDocs(q);
  
      const workouts = snapshot.docs.map(doc => doc.data());
  
      return { workouts: workouts };
  
    } catch (error) {
      console.error("Error searching workouts with Firestore index:", error);
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
  },


  /**
   * Delete a workout by ID and clean up related data
   * 
   * @param {string} workoutId - ID of the workout to delete
   * @param {string} userEmail - Email of the user (for security)
   * @returns {Promise<boolean>} Success status
   */
  deleteWorkout: async (workoutId, userEmail) => {
    try {
      // Find and delete the workout document
      const workoutQuery = query(
        collection(db, 'Routines'), 
        where('id', '==', workoutId),
        where('user.email', '==', userEmail)
      );
      const workoutSnapshot = await getDocs(workoutQuery);
      
      if (workoutSnapshot.empty) {
        console.log("Workout not found or not owned by user");
        return false;
      }
      
      // Delete the workout document
      await deleteDoc(workoutSnapshot.docs[0].ref);
      
      // Remove from user's favorites if it exists
      const favoritesDocRef = doc(db, 'Favorites', userEmail);
      const favoritesDoc = await getDoc(favoritesDocRef);
      
      if (favoritesDoc.exists()) {
        const currentFavorites = favoritesDoc.data().favorites || [];
        const updatedFavorites = currentFavorites.filter(id => id !== workoutId);
        
        if (currentFavorites.length !== updatedFavorites.length) {
          await updateDoc(favoritesDocRef, { favorites: updatedFavorites });
        }
      }

      const WorkoutSessionService = await import('./WorkoutSessionService');
      await WorkoutSessionService.default.deleteSession(workoutId);
      
      return true;
    } catch (error) {
      console.error(`Error deleting workout ${workoutId}:`, error);
      return false;
    }
  },


  /**
   * Update workout title
   * @param {string} workoutId - ID of workout to update
   * @param {string} newTitle - New title
   * @param {string} userEmail - User email for security
   * @returns {Promise<boolean>} Success status
   */
  updateWorkoutTitle: async (workoutId, newTitle, userEmail) => {
    try {
      const workoutQuery = query(
        collection(db, 'Routines'),
        where('id', '==', workoutId),
        where('user.email', '==', userEmail)
      );
      const workoutSnapshot = await getDocs(workoutQuery);
      
      if (workoutSnapshot.empty) return false;
      
      const docRef = doc(db, 'Routines', workoutSnapshot.docs[0].id);
      await updateDoc(docRef, {
        title: newTitle,
        lastUpdated: new Date()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating workout title:`, error);
      return false;
    }
  },


  /**
   * Update category name
   * @param {string} oldName - Current category name
   * @param {string} newName - New category name  
   * @param {string} userEmail - User email for security
   * @returns {Promise<boolean>} Success status
   */
  updateCategoryName: async (oldName, newName, userEmail) => {
    try {
      // Update category document
      const categoryQuery = query(
        collection(db, 'Category'),
        where('name', '==', oldName),
        where('userEmail', '==', userEmail)
      );
      const categorySnapshot = await getDocs(categoryQuery);
      
      if (categorySnapshot.empty) return false;
      
      // Update category name
      const categoryDoc = categorySnapshot.docs[0];
      await updateDoc(categoryDoc.ref, { name: newName });
      
      // Update all workouts in this category
      const workoutsQuery = query(
        collection(db, 'Routines'),
        where('category', '==', oldName),
        where('user.email', '==', userEmail)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      
      const batch = writeBatch(db);
      workoutsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { category: newName });
      });
      await batch.commit();
      
      return true;
    } catch (error) {
      console.error(`Error updating category name:`, error);
      return false;
    }
  },


  /**
   * Delete a category and handle workouts in that category
   * 
   * @param {string} categoryName - Name of the category to delete
   * @param {string} userEmail - Email of the user (for security)
   * @param {string} reassignCategory - Category to reassign workouts to
   * @returns {Promise<boolean>} Success status
   */
  deleteCategory: async (categoryName, userEmail, reassignCategory = 'Uncategorized') => {
    try {
      // Find category document
      const categoryQuery = query(
        collection(db, 'Category'),
        where('name', '==', categoryName),
        where('userEmail', '==', userEmail)
      );
      const categorySnapshot = await getDocs(categoryQuery);
      
      if (categorySnapshot.empty) {
        console.log("Category not found or not owned by user");
        return false;
      }
      
      // Find all workouts in this category
      const workoutsQuery = query(
        collection(db, 'Routines'),
        where('category', '==', categoryName),
        where('user.email', '==', userEmail)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      
      // Delete all workouts in this category
      const batch = writeBatch(db);
      workoutsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Delete the category document
      await deleteDoc(categorySnapshot.docs[0].ref);
      
      return true;
    } catch (error) {
      console.error(`Error deleting category ${categoryName}:`, error);
      return false;
    }
  }
};