// entire workout page once clicked on

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import WorkoutInfo from '../../components/WorkoutDetails/WorkoutInfo'
import WorkoutSubInfo from '../../components/WorkoutDetails/WorkoutSubInfo'
import CreatorInfo from '../../components/WorkoutDetails/CreatorInfo'
import {Colors} from '../../constants/Colors'
import { useUser } from '@clerk/clerk-expo'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'



export default function WorkoutDetails() {

    const params = useLocalSearchParams();
    const workout = {     // all the workout data passed not as prop, but params for screen-to-screen navigation
                          // props used for parent-child relationship
        ...params,
        exercises: JSON.parse(params.exercises),
        user: JSON.parse(params.user)
    };
    const navigation = useNavigation()
    const {user} = useUser()
    const router = useRouter()


    // whenever this component loads, makes the header transparent
    useEffect(() => {
    navigation.setOptions({
        headerTransparent: true, // title bar gone
        headerTitle: '' // empty header title
    })
    }, [])


    // creates two documents
const InitiateChat = async() => {
    try {
        // Verify required data exists
        if (!user?.primaryEmailAddress?.emailAddress || !workout?.user?.email || 
            !user?.imageUrl || !user?.fullName || 
            !workout?.user?.imageUrl || !workout?.user?.name) {
            console.error("Missing required user data:", {
                currentUser: {
                    email: user?.primaryEmailAddress?.emailAddress,
                    image: user?.imageUrl,
                    name: user?.fullName
                },
                workoutUser: {
                    email: workout?.user?.email,
                    image: workout?.user?.imageUrl,
                    name: workout?.user?.name
                }
            });
            return;
        }
 
        // the doc id format is: {current_user_email}_{creator_user_email}
        const docId1 = user.primaryEmailAddress.emailAddress+'_'+workout.user.email
        // same as above but reversed
        const docId2 = workout.user.email+'_'+user.primaryEmailAddress.emailAddress
        const q = query(collection(db,'Chat'), where('id','in',[docId1,docId2]))  // OR condition
        
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach(doc => {
            console.log("Doc found")
            return router.push({
                pathname: 'chat-details',
                params: {id: doc.id}
            });
        })
 
        // if document doesn't exist yet, create a new one
        if (querySnapshot.docs?.length == 0) {
            await setDoc(doc(db,'Chat',docId1), {
                id: docId1,
                users: [    // an array of both current user and creator data
                    {   
                        email: user.primaryEmailAddress.emailAddress,
                        imageUrl: user.imageUrl,
                        name: user.fullName
                    },
                    {
                        email: workout.user.email,
                        imageUrl: workout.user.imageUrl,
                        name: workout.user.name
                    }
                ],
                userIds: [user.primaryEmailAddress.emailAddress, workout.user.email]
            })
            console.log("Doc found")
            return router.push({
                pathname: 'chat-details',
                params: {id: docId1}
            });
        }
    } catch (error) {
        console.error("InitiateChat error:", error);
        console.log("Error details:", {
            user: user?.primaryEmailAddress?.emailAddress,
            workout: workout?.user?.email,
            error: error.message
        });
    }
 }



    return (
        <View style={styles.container}>
            <ScrollView>
            {/* Workout Info */}
            <WorkoutInfo workout={workout} />
            {/* Workout SubInfo */}
            <WorkoutSubInfo workout={workout} />
            {/* creator details */}
            <CreatorInfo workout={workout} />
            <View style={styles.spacer} />
            </ScrollView>
            
            {/* Chat button */}
            <View style={styles.bottomContainer}>
            <TouchableOpacity
                onPress={InitiateChat}
                style={styles.chatButton}>
                <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
            </View>
        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background
    },
    spacer: {
        height: 70
    },
     bottomContainer: {
        position: 'absolute',  // make the Chat button fixed from ScrollView
        width: '100%',
        bottom: 0
    },
    chatButton: {
        padding: 15,
        backgroundColor: Colors.light.primary
    },
    chatButtonText: {
        textAlign: 'center',
        fontFamily: 'outfit-medium', 
        fontSize: 20,
        color: Colors.light.background
    }
})