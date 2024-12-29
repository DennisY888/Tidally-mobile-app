// top half display once clicked into a workout/file
// displaying workout image, title, and estimated duration
import { View, Text, Image } from 'react-native'
import React from 'react'
import {Colors} from '../../constants/Colors'
import MarkFav from '../MarkFav'



export default function WorkoutInfo({workout}) {

    return workout && (
        <View>
          <Image 
            source={{uri: workout?.imageUrl}}
            style={{
              width: '100%',
              height: 400,
              objectFit: 'cover'
            }}
          />
          <View style={{
            padding: 20,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: Colors.light.background
          }}>
            <View>
              <Text style={{
                fontFamily: 'outfit-bold',
                fontSize: 27,
                color: Colors.light.text
              }}>
                {workout?.title}
              </Text>
              <Text style={{
                fontFamily: 'outfit',
                fontSize: 16,
                color: Colors.light.secondary
              }}>
                {`${workout?.est_time} MIN`}
              </Text>
            </View>
            <MarkFav workout={workout}/> 
          </View>
        </View>
      )
}