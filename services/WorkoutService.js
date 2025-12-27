// services/WorkoutService.js

import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, writeBatch, query, where, limit, orderBy, startAfter } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/FirebaseConfig';


export const WorkoutService = {

  getWorkouts: async ({ 
    category = null, 
    userEmail = null, 
    limit: resultLimit = 10, 
    lastVisible = null,
    orderByField = 'id', 
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
   * Updates the cover image for a specific workout.
   * @param {string} workoutId - The ID of the workout to update.
   * @param {string} userEmail - The email of the user for security.
   * @returns {Promise<boolean>} Success status.
   */
  updateWorkoutImage: async (workoutId, userEmail) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled) {
        return false; 
      }

      const imageUri = result.assets[0].uri;

      const compressedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      const resp = await fetch(compressedImage.uri);
      const blobImage = await resp.blob();
      const storageRef = ref(storage, `Tidally/${Date.now()}.jpg`);
      
      await uploadBytes(storageRef, blobImage);
      const downloadUrl = await getDownloadURL(storageRef);

      const workoutQuery = query(
        collection(db, 'Routines'),
        where('id', '==', workoutId),
        where('user.email', '==', userEmail)
      );
      const workoutSnapshot = await getDocs(workoutQuery);

      if (workoutSnapshot.empty) {
        return false;
      }
      
      const docRef = doc(db, 'Routines', workoutSnapshot.docs[0].id);
      await updateDoc(docRef, {
        imageUrl: downloadUrl,
        lastUpdated: new Date()
      });
      
      return true;

    } catch (error) {
      console.error("Error updating workout image:", error);
      return false;
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
    const snapshot = await getDocs(collection(db, 'Routines'));
    
    console.log(`Found ${snapshot.docs.length} total documents in Routines collection`);
    
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


/**
   * Updates the image for a specific category.
   * @param {string} categoryId - The Firestore document ID of the category to update.
   * @param {string} userId - The authenticated user's ID.
   * @returns {Promise<boolean>} Success status.
   */
  updateCategoryImage: async (categoryId, userId) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        return false;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) {
        return false; 
      }

      const imageUri = result.assets[0].uri;

      const compressedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      const resp = await fetch(compressedImage.uri);
      const blobImage = await resp.blob();

      const storageRef = ref(storage, `category-icons/${userId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blobImage);
      const downloadUrl = await getDownloadURL(storageRef);

      const docRef = doc(db, 'Category', categoryId);
      await updateDoc(docRef, { imageUrl: downloadUrl });
      
      return true;

    } catch (error) {
      console.error("Error updating category image:", error);
      return false;
    }
  },


searchWorkouts: async (searchTerm, userEmail) => {
    try {
      const lowercasedTerm = searchTerm.toLowerCase().trim();
      if (lowercasedTerm === '' || !userEmail) return { workouts: [] };

      try {
        const q = query(
          collection(db, 'Routines'),
          where('user.email', '==', userEmail), 
          where('searchIndex', 'array-contains', lowercasedTerm),
          limit(20)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return { workouts: snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id })) };
        }
      } catch (indexError) {
      }

      const qFallback = query(
        collection(db, 'Routines'),
        where('user.email', '==', userEmail),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshotFallback = await getDocs(qFallback);
      const allDocs = snapshotFallback.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

      const filtered = allDocs.filter(w => {
        const titleMatch = w.title?.toLowerCase().includes(lowercasedTerm);
        const categoryMatch = w.category?.toLowerCase().includes(lowercasedTerm);
        const exerciseMatch = w.exercises?.some(ex => ex.name?.toLowerCase().includes(lowercasedTerm));
        return titleMatch || categoryMatch || exerciseMatch;
      });

      return { workouts: filtered };

    } catch (error) {
      console.error("Error searching workouts:", error);
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
      const q = query(collection(db, 'Routines'), where('id', '==', workoutId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }
      
      const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
      
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


  deleteWorkout: async (workoutId, userEmail) => {
    try {
      const q = query(collection(db, 'Routines'), where('id', '==', workoutId), where('user.email', '==', userEmail));
      const snap = await getDocs(q);
      
      if (snap.empty) return false;
      await deleteDoc(snap.docs[0].ref);
      
      const favRef = doc(db, 'Favorites', userEmail);
      const favSnap = await getDoc(favRef);
      if (favSnap.exists()) {
        const newFavs = (favSnap.data().favorites || []).filter(id => id !== workoutId);
        await updateDoc(favRef, { favorites: newFavs });
      }

      const WorkoutSessionService = (await import('./WorkoutSessionService')).default;
      await WorkoutSessionService.deleteSession(workoutId);
      
      return true;
    } catch (error) {
      console.error(error);
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
      const categoryQuery = query(
        collection(db, 'Category'),
        where('name', '==', oldName),
        where('userEmail', '==', userEmail)
      );
      const categorySnapshot = await getDocs(categoryQuery);
      
      if (categorySnapshot.empty) return false;
      
      const categoryDoc = categorySnapshot.docs[0];
      await updateDoc(categoryDoc.ref, { name: newName });
      
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
      
      const workoutsQuery = query(
        collection(db, 'Routines'),
        where('category', '==', categoryName),
        where('user.email', '==', userEmail)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      
      const batch = writeBatch(db);
      workoutsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      await deleteDoc(categorySnapshot.docs[0].ref);
      
      return true;
    } catch (error) {
      console.error(`Error deleting category ${categoryName}:`, error);
      return false;
    }
  }
};