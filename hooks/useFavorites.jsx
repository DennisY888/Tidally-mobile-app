// hooks/useFavorites.jsx
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import Shared from '../Shared/Shared';


export const useFavorites = (user) => {
  const [favIds, setFavIds] = useState([]);
  const [favWorkouts, setFavWorkouts] = useState([]);
  const [loader, setLoader] = useState(false);

  
  const getFavWorkouts = async (favId) => {
    setLoader(true);
    setFavWorkouts([]);
    
    if (!favId?.length) {
      setLoader(false);
      return;
    }
    
    try {
      // Fix: Use favId instead of favId_
      const q = query(collection(db, 'Routines'), where('id', 'in', favId));
      const querySnapshot = await getDocs(q);
      
      const newWorkouts = [];
      querySnapshot.forEach((doc) => {
        newWorkouts.push(doc.data());
      });
      
      setFavWorkouts(newWorkouts);
    } catch (error) {
      console.error("Error fetching favorite workouts:", error);
    } finally {
      setLoader(false);
    }
  };


  const refresh = useCallback(async () => {
    console.log("========== DIAGNOSTIC: useFavorites.refresh ==========");
    console.log("User exists:", !!user);
    
    if (!user) {
      console.log("No user, returning early");
      return;
    }
    
    setLoader(true);
    try {
      console.log("Calling Shared.GetFavList");
      const result = await Shared.GetFavList(user);
      console.log("GetFavList result:", result);
      
      console.log("Setting favIds from result.favorites:", result?.favorites);
      setFavIds(result?.favorites);
      
      setLoader(false);
      console.log("Calling getFavWorkouts with favorites");
      await getFavWorkouts(result?.favorites);
    } catch (error) {
      console.error("Error in refresh:", error);
      setLoader(false);
    }
    
    console.log("========== END DIAGNOSTIC: useFavorites.refresh ==========");
  }, [user]);


  useEffect(() => {
    user && refresh();
  }, [user]);

  return { favWorkouts, loader, refresh };
};