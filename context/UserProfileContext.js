// context/UserProfileContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import { UserService } from '../services/UserService';

const UserProfileContext = createContext({
  userProfile: null,
  updateUserProfile: async () => {},
  isLoaded: false,
});

export const UserProfileProvider = ({ children }) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isUserLoaded || !user) {
      setIsLoaded(true);
      return;
    }

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) return;

    // Real-time listener following your useRealtimeFavorites.js pattern
    const unsubscribe = onSnapshot(doc(db, 'Users', userEmail), async (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data());
      } else {
        // Create initial profile if doesn't exist
        const clerkData = { name: user.fullName, imageUrl: user.imageUrl };
        const newProfile = await UserService.createUserProfile(userEmail, clerkData);
        setUserProfile(newProfile);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error with user profile snapshot:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [isUserLoaded, user]);

  const updateUserProfile = async (updates) => {
    if (!user) return false;
    return await UserService.updateUserProfile(user.primaryEmailAddress.emailAddress, updates);
  };

  return (
    <UserProfileContext.Provider value={{ userProfile, updateUserProfile, isLoaded }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error('useUserProfile must be used within a UserProfileProvider');
  return context;
};