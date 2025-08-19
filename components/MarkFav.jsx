// components/MarkFav.jsx

import { View, Pressable } from 'react-native';
import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRealtimeFavorites } from '../hooks/useRealtimeFavorites'; // <-- Use the new hook

export default function MarkFav({ workout }) {
  // 1. Get real-time data and the update function from our central hook
  const { favIds, updateFavorites, isLoaded } = useRealtimeFavorites();

  // 2. Determine if the current workout is a favorite
  const isFavorite = favIds.includes(workout.id);


  const handleToggleFavorite = async () => {
    let newFavIds;
    if (isFavorite) {
      // Remove from favorites
      newFavIds = favIds.filter(id => id !== workout.id);
    } else {
      // Add to favorites
      newFavIds = [...favIds, workout.id];
    }
    // 3. Call the central update function. The onSnapshot listener will handle the UI update.
    await updateFavorites(newFavIds);
  };

  // Don't render until the favorites list is loaded
  if (!isLoaded) {
    return <View />;
  }

  return (
    <Pressable onPress={handleToggleFavorite}>
      {isFavorite ? (
        <AntDesign name="heart" size={24} color="red" />
      ) : (
        <AntDesign name="hearto" size={24} color="white" /> // Changed to white for better visibility on image
      )}
    </Pressable>
  );
}