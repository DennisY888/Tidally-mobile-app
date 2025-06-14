// hooks/useWorkouts.js
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

export const useWorkouts = (selectedCategory) => {
  const { user } = useUser();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const queryConstraints = [
      where('user.email', '==', user.primaryEmailAddress.emailAddress),
      orderBy('id', 'desc')
    ];

    if (selectedCategory) {
      queryConstraints.push(where('category', '==', selectedCategory));
    }

    const q = query(collection(db, 'Routines'), ...queryConstraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workoutsData = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
      setWorkouts(workoutsData);
      setLoading(false);
    }, (error) => {
      console.error("Error with workouts snapshot: ", error);
      if (error.code === 'failed-precondition') {
        console.log("Firestore index missing. Please create it. The error message contains a link.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory, user?.primaryEmailAddress?.emailAddress]);

  return { workouts, loading };
};