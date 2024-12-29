import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import Header from '../../components/Home/Header'
import Slider from '../../components/Home/Slider'
import WorkoutsByCategory from '../../components/Home/WorkoutsByCategory'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {Colors} from '../../constants/Colors'
import { Link } from 'expo-router'


export default function Home() {
  return (
    <View className="p-5 mt-5">
      {/* Header  */}
      <Header/>
        {/* Slider (used for event notifications or advertisements across all users)  */}
      <Slider/>
        {/* Workouts + Folders (resebmels Category & List Of Pets) */}
        <WorkoutsByCategory/>
        {/* Add New File Option  */}
        
        <Link href={'/add-new-workout'}
          style={styles.addNewWorkoutContainer}>
          <MaterialIcons name="playlist-add-circle" size={24} color="blue" />
            <Text style={{
              fontFamily:'outfit-medium',
              color:Colors.dark.text,
              fontSize:18
            }}>Add New Workout</Text>
        </Link>
    </View>
  )
}


const styles = StyleSheet.create({
  addNewWorkoutContainer:{
    display:'flex',
    flexDirection:'row',
    gap:10,
    alignItems:'center',
    padding:20,
    marginTop:20,
    textAlign:'center',
    backgroundColor:Colors.light.secondary,
    borderWidth:1,
    borderColor:Colors.dark.primary,
    borderRadius:15,
    borderStyle:'dashed',
    justifyContent:'center'
  }
})






