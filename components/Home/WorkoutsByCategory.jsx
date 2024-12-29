// resebmles PetListByCategory
// attributes: category (relationship), imageUrl, title, 


import { View, Text, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import Folder from './Folder'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import Workout from './Workout'



export default function WorkoutsByCategory() {

    const [workouts,setWorkouts]=useState([]);
    const [loader,setLoader]=useState(false);  // is loading or not 


    useEffect(()=>{
        GetWorkouts('Folder 1')
    },[])


    // Used to get Workouts in the corresponding Folder
    const GetWorkouts=async(category)=>{  // category is the folder name
        setLoader(true)
        setWorkouts([]);
        const q=query(collection(db,'Routines'),where('category','==',category)); 
        const querySnapshot=await getDocs(q); // q is a query object defining the query parameters/criteria
                                              // getDocs is required to actually run the query against Firestore
        querySnapshot.forEach(doc=>{
            setWorkouts(workouts=>[...workouts,doc.data()])  // accumulates one document at a time as the forEach loop processes each document
        })
        setLoader(false);
    }



    return (
        <View>
            {/* passing callback as prop into Folder
            whenever user clicks different folder GetWorkout() gets called in Folder component */}
        <Folder category={(value)=>GetWorkouts(value)}/>
    
        <FlatList
            data={workouts}
            style={{marginTop:10}}
            horizontal={true}
            refreshing={loader}
            showsHorizontalScrollIndicator={false}
            // onRefresh allows pull-to-refresh within our FlatList
            onRefresh={()=>GetWorkouts('Folder 1')}
            renderItem={({item,index})=>(
            <Workout workout={item} />
            )}
        />

        </View>
    )
}