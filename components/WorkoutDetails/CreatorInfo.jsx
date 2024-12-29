import { View, Text, Image, StyleSheet } from 'react-native'
import React from 'react'
import {Colors} from '../../constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';



export default function OwnerInfo({workout}) {

    return (
        <View style={styles.container}>
          <View style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 20
          }}>
            <Image source={{uri: workout?.user?.imageUrl}}
              style={{
                width: 50,
                height: 50,
                borderRadius: 99
              }}
            />
            <View>
              <Text style={{
                fontFamily: 'outfit-medium',
                fontSize: 17,
                color: Colors.light.text
              }}>{workout?.user?.name}</Text>
              <Text style={{
                fontFamily: 'outfit',
                color: Colors.light.secondary
              }}>Creator</Text>
            </View>
          </View>
          <Ionicons name="send-sharp" size={24} color={Colors.light.primary} />
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginHorizontal: 20,
        paddingHorizontal: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        borderWidth: 1,
        borderRadius: 15,
        padding: 10,
        borderColor: Colors.light.primary,
        backgroundColor: Colors.light.background,
        justifyContent: 'space-between'
    }
})