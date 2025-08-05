import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

export const UserService = {
  getUserProfile: async (userEmail) => {
    try {
      const docRef = doc(db, 'Users', userEmail);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { ...docSnap.data(), _id: docSnap.id } : null;
    } catch (error) {
      console.error(`Error fetching user profile ${userEmail}:`, error);
      return null;
    }
  },

  createUserProfile: async (userEmail, clerkData) => {
    try {
      const userData = {
        email: userEmail,
        clerkData,
        customProfile: {
          animalType: null,
          animalColor: null,
          backgroundColor: '#E9F0F8', // Your primaryLight color
          useCustom: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'Users', userEmail), userData);
      return userData;
    } catch (error) {
      console.error(`Error creating user profile:`, error);
      return null;
    }
  },

  updateUserProfile: async (userEmail, updates) => {
    try {
      await updateDoc(doc(db, 'Users', userEmail), {
        ...updates,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error(`Error updating user profile:`, error);
      return false;
    }
  }
};