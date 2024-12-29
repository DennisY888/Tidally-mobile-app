import { View, Text, Image, TextInput, StyleSheet, ScrollView, TouchableOpacity, Pressable, ToastAndroid, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation, useRouter } from 'expo-router'
import { Colors } from './../../constants/Colors'
import { Picker } from '@react-native-picker/picker';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, storage } from '../../config/FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useUser } from '@clerk/clerk-expo';

export default function AddNewWorkout() {
    const navigation=useNavigation();
    const [formData,setFormData]=useState(
        { category:'Dogs',sex:'Male'}
    );  // dictionary with string keys and value of any type
    const [categoryList,setCategoryList]=useState([]);
    const [selectedCategory,setSelectedCategory]=useState();
    
    const [image,setImage]=useState();
    const [loader,setLoader]=useState(false);
    const {user}=useUser();
    const router=useRouter();


    useEffect(()=>{
        navigation.setOptions({
            headerTitle:'Add New Workout'
        })
        GetCategories();
    },[])   // executed once when component mounts


    // fetch folders from Category collection in Firestore
    const GetCategories=async()=>{
        setCategoryList([]);
        const snapshot=await getDocs(collection(db,'Category'));
        snapshot.forEach((doc)=>{
            setCategoryList(categoryList=>[...categoryList,doc.data()])
        })

    }


    /**
     * used to pick image from gallery
     */
    const imagePicker=async()=>{
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });
      
          if (!result.canceled) {
            setImage(result.assets[0].uri);
          }
    }


    // fieldName should match the corresponding field name in Firestore
    const handleInputChange=(fieldName,fieldValue)=>{
        setFormData(prev=>({
            ...prev,
            [fieldName]:fieldValue
        }))
    }


    const onSubmit=()=>{
        if (Object.keys(formData).length!=8) {
            ToastAndroid.show('Enter All Details',ToastAndroid.SHORT)
            return ;
        }
        UploadImage();
    }


    /**
     * Used to upload Pet Image to Firebase Storage (server)
     */
    const UploadImage=async()=>{
        setLoader(true)
        const resp=await fetch(image);
        const blobImage=await resp.blob();
        const storageRef=ref(storage,Date.now()+'.jpg');
        console.log(storageRef)
        uploadBytes(storageRef,blobImage).then((snapshot)=>{
            console.log('File Uploaded')
        }).then(resp=>{
            getDownloadURL(storageRef).then(async(downloadUrl)=>{
                console.log(downloadUrl);
                SaveFormData(downloadUrl)
            })
        })
    }


    const SaveFormData=async(imageUrl)=>{
        const docId=Date.now().toString();
        await setDoc(doc(db,'Pets',docId),{
            ...formData,
            imageUrl:imageUrl,
            username:user?.fullName,
            email:user?.primaryEmailAddress?.emailAddress,
            userImage:user?.imageUrl,
            id:docId
        })
        setLoader(false);
        router.replace('/(tabs)/home')
    }


  return (
    <ScrollView style={{
        padding:20
    }}>

      <Text style={{
        fontFamily:'outfit-medium',
        fontSize:20
      }}>Create New Workout</Text>


      <Pressable onPress={imagePicker}>
       {!image? <Image source={require('./../../assets/images/placeholder.webp')}
        style={{
            width:100,
            height:100,
            borderRadius:15, 
            borderWidth:1,
            borderColor: Colors.light.lightGray
        }}/> :
        <Image source={{uri:image}}
        style={{
            width:100,
            height:100,
            borderRadius:15, 
        }} />}
      </Pressable>


      <View style={styles.inputContainer}>
        <Text style={styles.label}>Workout Name *</Text>
        {/* user inputted value will be caught and emit by onChangeText */}
        <TextInput style={styles.input} 
        onChangeText={(value)=>handleInputChange('title',value)} /> 
      </View>


      <View style={styles.inputContainer}>
            <Text style={styles.label}>Choose Folder *</Text>
            <Picker
                // here we pass our state into selectedValue
                selectedValue={selectedCategory} 
                style={styles.input}
                onValueChange={(itemValue, itemIndex) =>{
                    setSelectedCategory(itemValue);
                    handleInputChange('category',itemValue)}}>

                {categoryList.map((category,index)=>(
                    // we set key={index} just do get rid of the uniqueness warning in list
                    <Picker.Item key={index} label={category.name} value={category.name} />
                ))}

            </Picker>
        </View>


      <View style={styles.inputContainer}>
        <Text style={styles.label}>Est. Duration *</Text>
        <TextInput style={styles.input} 
         keyboardType='number-pad'
        onChangeText={(value)=>handleInputChange('est_time',value)} />
      </View>
       


      <TouchableOpacity
       style={styles.button}
       disabled={loader} 
      onPress={onSubmit}>
       {loader?<ActivityIndicator size={'large'}  />:
        <Text style={{fontFamily:'outfit-medium',textAlign:'center'}}>Submit</Text>
    }
      </TouchableOpacity>
    </ScrollView>
  )
}



const styles = StyleSheet.create({
    inputContainer: {
        marginVertical: 5
    },
    input: {
        padding: 10,
        backgroundColor: Colors.light.background,
        borderRadius: 7,
        fontFamily: 'outfit'
    },
    label: {
        marginVertical: 5,
        fontFamily: 'outfit',
        color: Colors.light.text
    },
    button: {
        padding: 15,
        backgroundColor: Colors.light.primary,
        borderRadius: 7,
        marginVertical: 10,
        marginBottom: 50
    }
})