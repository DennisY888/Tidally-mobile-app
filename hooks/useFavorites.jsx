// hooks/useFavorites.js
/*
Use hooks when:
    abstract away stateful logic and make it reusable
    each component using it gets its own instance of the fresh states
*/
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import Shared from '../Shared/Shared';

export const useFavorites = (user) => {
  const [favIds, setFavIds] = useState([]);
  const [favWorkouts, setFavWorkouts] = useState([]);
  const [loader, setLoader] = useState(false);


  const getFavWorkouts = async (favId_) => {   // same as GetFavWorkouts
    setLoader(true);
    setFavWorkouts([]);
    if (!favId_?.length) {
      setLoader(false);
      return;
    }
    const q = query(collection(db, 'Routines'), where('id', 'in', favId_));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      setFavWorkouts(prev => [...prev, doc.data()]);
    });
    setLoader(false);
  }


  const refresh = useCallback(async () => {  // basically GetFavWorkoutIds wrapped in useCalback
    if (!user) return;
    setLoader(true);
    const result = await Shared.GetFavList(user);
    console.log(result)
    setFavIds(result?.favorites);
    setLoader(false);
    getFavWorkouts(result?.favorites);
  }, [user]);


  useEffect(() => {
    user && refresh();
  }, [user]);


  return { favWorkouts, loader, refresh };
};