// a workout/file within folder/category

import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import {Colors} from '../../constants/Colors'
import { useRouter } from 'expo-router'
import MarkFav from './../../components/MarkFav'


export default function Workout({workout}) {
    const router=useRouter();
    return (
        // TouchableOpacity is basically View with onPress event
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/workout-details',
            params: {
              ...workout,
              exercises: JSON.stringify(workout.exercises),  // navigation params only support primitive data types 
              user: JSON.stringify(workout.user)             // otherwise, complex data structures would be incorrectly converted or lost during navigation
            }
          })}
          className={`bg-[${Colors.light.background}] p-4 mr-5 rounded-2xl shadow-lg`}>
            <View style={{
                position:'absolute',
                zIndex:10,
                right:20,
                top:20
            }}>
                {/* <MarkFav workout={workout}/> */}
            </View>
            <Image 
                source={{uri: workout?.imageUrl}}
                className="w-44 h-40 rounded-xl" 
            />
            <Text className={`font-outfit-medium text-lg text-[${Colors.light.text}] mt-3 mb-2`}>
                {workout?.title}
            </Text>
            <View className="flex-row items-center">
                <Text className={`font-outfit text-sm text-[${Colors.light.primary}] bg-[${Colors.light.lightGray}] py-1.5 px-3 rounded-lg`}>
                {workout.est_time} MIN
                </Text>
            </View>
        </TouchableOpacity>
      )
}