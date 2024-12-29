import { View, Text, Image } from 'react-native'
import React from 'react'
import {Colors} from '../../constants/Colors'

export default function WorkoutSubInfoCard({icon, title, value}) {

    return (
        <View style={{
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
            <Image source={icon}
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
                {value}
            </Text>
            </View>
        </View>
    )
}