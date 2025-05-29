import { View, Text, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { Colors } from '../../constants/Colors'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import EditExerciseModal from './EditExerciseModal'

export default function WorkoutSubInfoCard({ icon, title, value, workoutId, exercise, onExerciseDeleted, onExerciseUpdated }) {
    const [modalVisible, setModalVisible] = useState(false);

    const handleLongPress = () => {
        Alert.alert(
            "Exercise Options",
            "What would you like to do with this exercise?",
            [
                {
                    text: "Edit",
                    onPress: () => setModalVisible(true),
                    style: "default"
                },
                {
                    text: "Delete",
                    onPress: handleDelete,
                    style: "destructive"
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        )
    }

    const handleDelete = async () => {
        try {
            // Query for document using id field since we store document ID in 'id' field
            // rather than using Firestore's auto-generated document ID
            const q = query(collection(db, 'Routines'), where('id', '==', workoutId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // Get actual Firestore document ID from query result
                const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
                await updateDoc(docRef, {
                    exercises: arrayRemove(exercise)
                });
                onExerciseDeleted(exercise);
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Failed to delete exercise');
        }
    }

    const handleUpdate = async (updatedExercise) => {
        try {
            const q = query(collection(db, 'Routines'), where('id', '==', workoutId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
                const docData = querySnapshot.docs[0].data();
                
                // Remove old exercise and add updated one
                const updatedExercises = docData.exercises.map(ex => 
                    (ex.name === exercise.name && 
                     ex.reps === exercise.reps && 
                     ex.time === exercise.time) ? updatedExercise : ex
                );

                await updateDoc(docRef, {
                    exercises: updatedExercises
                });
                
                onExerciseUpdated(exercise, updatedExercise);
            }
        } catch (error) {
            console.error('Error updating exercise:', error);
            Alert.alert('Error', 'Failed to update exercise');
        }
    }

    return (
        <>
            <TouchableOpacity 
                onLongPress={handleLongPress}
                delayLongPress={500}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.light.background,
                    padding: 10,
                    margin: 5,
                    borderRadius: 8,
                    gap: 20,
                    flex: 1,
                    shadowColor: Colors.light.shadow,
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5
                }}>
                <Image 
                    source={icon}
                    style={{
                        width: 40,
                        height: 40
                    }}
                />
                <View style={{flex: 1}}>
                    <Text style={{
                        fontFamily: 'outfit',
                        fontSize: 16,
                        color: Colors.light.secondary
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontFamily: 'outfit-medium',
                        fontSize: 16,
                        color: Colors.light.text
                    }}>
                        {value} • {exercise.sets} sets
                    </Text>
                </View>
            </TouchableOpacity>

            <EditExerciseModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                exercise={exercise}
                onSave={handleUpdate}
            />
        </>
    )
}