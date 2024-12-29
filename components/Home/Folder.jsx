// resembles Category
// attributes: Name, ImageUrl





import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './../../config/FirebaseConfig'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from './../../constants/Colors'


// directly destructuring category from props object
export default function Folder({category}) {
    const [categoryList, setCategortList] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('Folder 1')  // change the background to the folder user clicked on
    

    // immediately after page loads, call GetCategories()
    useEffect(() => {
        GetCategories()
    }, [])


    // GET all folders (categories) from the corresponding Category collection
    const GetCategories = async() => {
    setCategortList([])   // re-initializes the state everytime we reload so no duplicate copies
    const snapshot = await getDocs(collection(db, 'Category'))
    snapshot.forEach((doc) => {
        setCategortList(categoryList => [...categoryList, doc.data()])
    })
    }


    return (
    <View style={styles.wrapper}>
        <Text style={styles.headerText}>Category</Text>
        <FlatList
        data={categoryList}
        numColumns={4}
        renderItem={({item}) => (
            <TouchableOpacity
            onPress={() => {
                setSelectedCategory(item.name)
                category(item.name)
            }}
            style={styles.itemWrapper}
            >
            <LinearGradient
                colors={selectedCategory === item.name ? 
                [Colors.light.primary, Colors.light.secondary] :
                [Colors.light.lightGray, Colors.light.background]}
                style={styles.container}
            >
                <Image 
                source={{uri: item?.imageUrl}}
                style={styles.categoryImage}
                />
            </LinearGradient>
            <Text style={styles.categoryText}>{item?.name}</Text>
            </TouchableOpacity>
        )}
        />
    </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
      marginTop: 20,
      paddingHorizontal: 15,
    },
    headerText: {
      fontFamily: 'outfit-medium',
      fontSize: 24,
      color: Colors.light.text,
      marginBottom: 15,
    },
    itemWrapper: {
      flex: 1,
      padding: 5,
    },
    container: {
      padding: 15,
      alignItems: 'center',
      borderRadius: 16,
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    categoryImage: {
      width: 45,
      height: 45,
    },
    categoryText: {
      textAlign: 'center',
      fontFamily: 'outfit',
      fontSize: 14,
      marginTop: 8,
      color: Colors.light.text,
    }
  })





