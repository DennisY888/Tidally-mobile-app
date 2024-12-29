import { View, Text, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import Shared from './../../Shared/Shared'
import { useUser } from '@clerk/clerk-expo'
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import Workout from './../../components/Home/Workout'
import { useFavorites } from '../../hooks/useFavorites';  // HOOK


export default function Favorite() {

  const {user}=useUser();
  const { favWorkouts, loader, refresh } = useFavorites(user);
  

  return (
    <View style={{ padding: 20, marginTop: 20 }}>
      <Text style={{ fontFamily: 'outfit-medium', fontSize: 30 }}>Favorites</Text>
      <FlatList
        data={favWorkouts}
        numColumns={2}
        onRefresh={refresh}
        refreshing={loader}
        renderItem={({ item }) => (
          <View style={{ margin: 5 }}>
            <Workout workout={item} />
          </View>
        )}
      />
    </View>
  );
}