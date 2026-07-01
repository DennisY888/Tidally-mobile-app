// hooks/useWorkouts.js
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

// Streams all of the signed-in user's workouts, newest first (by `id`, which is the
// creation-time epoch). Any further ordering (A–Z, last used) is applied client-side
// on the home screen, so this needs only the existing user.email + id index.
export const useWorkouts = () => {
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

    const q = query(
      collection(db, 'Routines'),
      where('user.email', '==', user.primaryEmailAddress.emailAddress),
      orderBy('id', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workoutsData = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
      setWorkouts(workoutsData);
      setLoading(false);
    }, (error) => {
      console.error("Error with workouts snapshot: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.primaryEmailAddress?.emailAddress]);

  return { workouts, loading };
};
