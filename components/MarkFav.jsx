// components/MarkFav.jsx

import { View, Pressable, Alert } from 'react-native';
import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRealtimeFavorites } from '../hooks/useRealtimeFavorites';

export default function MarkFav({ workout }) {
  const { favIds, updateFavorites, isLoaded } = useRealtimeFavorites();
  const isFavorite = favIds.includes(workout.id);

  const removeFromFavorites = async () => {
    await updateFavorites(favIds.filter(id => id !== workout.id));
  };

  const addToFavorites = async () => {
    await updateFavorites([...favIds, workout.id]);
  };

  const handlePress = () => {
    if (isFavorite) {
      // Confirm before un-favoriting so a stray tap doesn't lose the user's saved workout
      Alert.alert(
        'Remove from Favorites?',
        `"${workout.title || 'This workout'}" will be removed from your favorites.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: removeFromFavorites },
        ],
        { cancelable: true }
      );
    } else {
      addToFavorites();
    }
  };

  if (!isLoaded) {
    return <View />;
  }

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      {isFavorite ? (
        <AntDesign name="heart" size={24} color="red" />
      ) : (
        <AntDesign name="hearto" size={24} color="white" />
      )}
    </Pressable>
  );
}