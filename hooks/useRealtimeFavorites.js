// hooks/useRealtimeFavorites.js

import { useState, useEffect, useContext, createContext } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

// 1. Create a Context to hold our real-time data
const FavoritesContext = createContext({
  favIds: [],
  updateFavorites: async () => {},
  isLoaded: false,
});

// 2. Create the Provider component. This will wrap our app.
// For now, we will use it within another hook, but this structure allows future expansion.
export const FavoritesProvider = ({ children }) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [favIds, setFavIds] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only proceed if the user is fully loaded
    if (!isUserLoaded || !user) {
      setIsLoaded(true); // Mark as loaded even if no user
      return;
    }

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) return;

    const docRef = doc(db, 'Favorites', userEmail);

    // 3. Establish the real-time listener
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFavIds(data.favorites || []);
      } else {
        // If the user has no favorites document yet, create one
        await setDoc(docRef, { email: userEmail, favorites: [] });
        setFavIds([]);
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Error with favorites snapshot:", error);
        setIsLoaded(true);
    });

    // 4. Cleanup function: This is crucial to prevent memory leaks.
    // It runs when the component unmounts.
    return () => unsubscribe();

  }, [isUserLoaded, user]);

  // 5. Create a function to update the database
  const updateFavorites = async (newFavIds) => {
    if (!user) return;
    const docRef = doc(db, 'Favorites', user.primaryEmailAddress.emailAddress);
    await updateDoc(docRef, { favorites: newFavIds });
  };

  const value = { favIds, updateFavorites, isLoaded };

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
};

// 6. Create the custom hook that our components will use to access the data
export const useRealtimeFavorites = () => {
  return useContext(FavoritesContext);
};