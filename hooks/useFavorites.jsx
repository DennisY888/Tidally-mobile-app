// hooks/useFavorites.js

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import { useRealtimeFavorites } from './useRealtimeFavorites'; // <-- Use the new hook

export const useFavorites = () => {
  // 1. Get the real-time list of favorite IDs
  const { favIds, isLoaded: favIdsLoaded } = useRealtimeFavorites();
  const [favWorkouts, setFavWorkouts] = useState([]);
  const [loader, setLoader] = useState(false);

  // 2. This effect runs whenever the list of favorite IDs changes
  useEffect(() => {
    // A function to fetch the full workout documents based on the IDs
    const getFavWorkouts = async () => {
      if (!favIdsLoaded) return; // Wait until the IDs are loaded

      setLoader(true);
      setFavWorkouts([]);

      // If there are no favorite IDs, we're done.
      if (!favIds || favIds.length === 0) {
        setLoader(false);
        return;
      }

      try {
        // Firestore 'in' queries are limited to 30 items per query. We must batch them.
        const workoutPromises = [];
        for (let i = 0; i < favIds.length; i += 30) {
          const batchIds = favIds.slice(i, i + 30);
          const q = query(collection(db, 'Routines'), where('id', 'in', batchIds));
          workoutPromises.push(getDocs(q));
        }

        const querySnapshots = await Promise.all(workoutPromises);
        const newWorkouts = [];
        querySnapshots.forEach(snapshot => {
          snapshot.forEach(doc => newWorkouts.push(doc.data()));
        });
        
        setFavWorkouts(newWorkouts);

      } catch (error) {
        console.error("Error fetching favorite workouts:", error);
      } finally {
        setLoader(false);
      }
    };

    getFavWorkouts();
  }, [favIds, favIdsLoaded]); // 3. The dependency array ensures this re-runs on any change

  // We no longer need the manual 'refresh' function as data is real-time.
  // The FlatList onRefresh can simply be an empty function or removed.
  return { favWorkouts, loader };
};