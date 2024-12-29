import { View, ScrollView } from 'react-native'
import React from 'react'
import WorkoutSubInfoCard from './WorkoutSubInfoCard'

export default function WorkoutSubInfo({workout}) {

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
        {workout?.exercises?.map((exercise, index) => (
          <WorkoutSubInfoCard
            key={index}
            icon={require('./../../assets/images/exercise_icon.png')}
            title={exercise.name}
            value={exercise.reps ? `${exercise.reps} reps` : `${exercise.time} sec`}
          />
        ))}
      </View>
    </View>
  )
}