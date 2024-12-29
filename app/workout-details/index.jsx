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
    const workout = {
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


    // Used to Initiate the chat between two users
    const InitiateChat = async() => {
    const docId1 = user?.primaryEmailAddress?.emailAddress+'_'+workout?.email
    const docId2 = workout?.email+'_'+user?.primaryEmailAddress?.emailAddress
    const q = query(collection(db,'Chat'), where('id','in',[docId1,docId2]))
    const querySnapshot = await getDocs(q)
    
    querySnapshot.forEach(doc => {
        router.push({
        pathname: '/chat',
        params: {id: doc.id}
        })
    })

    if (querySnapshot.docs?.length == 0) {
        await setDoc(doc(db,'Chat',docId1), {
        id: docId1,
        users: [
            {
                email: user?.primaryEmailAddress?.emailAddress,
                imageUrl: user?.imageUrl,
                name: user?.fullName
            },
            {
                email: workout?.email,
                imageUrl: workout?.userImage,
                name: workout?.username
            }
        ],
        userIds: [user?.primaryEmailAddress?.emailAddress, workout?.email]
        })
        router.push({
        pathname: '/chat',
        params: {id: docId1}
        })
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