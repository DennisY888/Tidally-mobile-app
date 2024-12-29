import { View, Text, FlatList, Image, StyleSheet, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {db} from './../../config/FirebaseConfig'



export default function Slider() {

  const [sliderList, setSliderList]=useState([]);

  useEffect(()=>{
      GetSliders(); 
  },[])

  const GetSliders=async()=>{
      setSliderList([]);  // every time we save component rerenders, avoid repetitive images
      const snapshot=await getDocs(collection(db,'Sliders')); // Get all the documents from Sliders collection
      snapshot.forEach((doc)=>{
          setSliderList(sliderList=>[...sliderList,doc.data()]) // add the data incrementally one by one
      })
  }


  return (
    <View style={{
        marginTop:15
    }}>
      {/* display a list of data */}
        <FlatList  
            data={sliderList}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({item})=>(
                <View>
                    <Image source={{uri:item?.imageUrl}}
                       style={styles?.sliderImage} 
                    />
                </View>
            )}
        />
    </View>
  )
}

// style for each image
const styles = StyleSheet.create({
    sliderImage:{
        width:Dimensions.get('screen').width*0.9,
        height:170,
        borderRadius:15,
        marginRight:15
    }
})