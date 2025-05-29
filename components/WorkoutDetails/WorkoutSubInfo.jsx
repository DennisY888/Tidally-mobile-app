import { View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import WorkoutSubInfoCard from './WorkoutSubInfoCard'
import AddExerciseModal from './AddExerciseModal'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/Colors'
import { useRouter } from 'expo-router';

export default function WorkoutSubInfo({workout}) {
    const [exercises, setExercises] = useState(workout?.exercises || [])
    const [modalVisible, setModalVisible] = useState(false)
    const router = useRouter();

    const handleExerciseDeleted = (deletedExercise) => {
        setExercises(exercises.filter(exercise => 
            exercise.name !== deletedExercise.name || 
            exercise.reps !== deletedExercise.reps ||
            exercise.time !== deletedExercise.time
        ))
    }

    const handleExerciseUpdated = (oldExercise, newExercise) => {
        setExercises(exercises.map(exercise => 
            (exercise.name === oldExercise.name && 
             exercise.reps === oldExercise.reps && 
             exercise.time === oldExercise.time) ? newExercise : exercise
        ))
    }

    const handleAddExercise = async (newExercise) => {
        try {
            const q = query(collection(db, 'Routines'), where('id', '==', workout.id));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docRef = doc(db, 'Routines', querySnapshot.docs[0].id);
                await updateDoc(docRef, {
                    exercises: [...exercises, newExercise]
                });
                setExercises([...exercises, newExercise]);
            }
        } catch (error) {
            console.error('Error adding exercise:', error);
            Alert.alert('Error', 'Failed to add exercise');
        }
    }

    return (
        <View style={{
            paddingHorizontal: 20,
            alignItems: 'center',
            width: '100%'
        }}>
            <View style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: '100%'
            }}>
                {exercises.map((exercise, index) => (
                    <WorkoutSubInfoCard
                        key={index}
                        icon={require('./../../assets/images/exercise_icon.png')}
                        title={exercise.name}
                        value={exercise.reps ? `${exercise.reps} reps` : `${exercise.time} sec`}
                        workoutId={workout.id}
                        exercise={exercise}
                        onExerciseDeleted={handleExerciseDeleted}
                        onExerciseUpdated={handleExerciseUpdated}
                    />
                ))}
            </View>

            <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 20,
                marginTop: 20
            }}>
                <TouchableOpacity 
                    onPress={() => setModalVisible(true)}
                    style={{
                        backgroundColor: Colors.light.primary,
                        padding: 15,
                        borderRadius: 30
                    }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => router.push({
                        pathname: '/workout-play',
                        params: {
                            ...workout,
                            exercises: JSON.stringify(exercises)
                        }
                    })}
                    style={{
                        backgroundColor: Colors.light.primary,
                        padding: 15,
                        borderRadius: 30
                    }}
                >
                    <Ionicons name="play" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <AddExerciseModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onAdd={handleAddExercise}
            />
        </View>
    )
}