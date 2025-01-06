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
    const navigation = useNavigation();
    const [formData, setFormData] = useState({});  // dictionary with string keys and value of any type
    const [categoryList, setCategoryList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState();
    
    const [image, setImage] = useState();  // selected image uri from user gallery
    const [loader, setLoader] = useState(false);
    const { user } = useUser();
    const router = useRouter();

    // NEW STATES FOR ADDING EXERCISES
    const [exercises, setExercises] = useState([]); // Array to store all exercises
    const [currentExercise, setCurrentExercise] = useState({
        name: '',
        reps: null,
        time: null
    });
    const [measurementType, setMeasurementType] = useState('reps'); // Track if user is inputting reps or time



    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Add New Workout'
        })
        GetCategories();
    }, [])   // executed once when component mounts



    // fetch folders from Category collection in Firestore
    const GetCategories = async() => {
        setCategoryList([]);
        const snapshot = await getDocs(collection(db,'Category'));
        snapshot.forEach((doc) => {
            setCategoryList(categoryList => [...categoryList, doc.data()])
        })
    }


    // pick image from gallery
    const imagePicker = async() => {
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
    const handleInputChange = (fieldName, fieldValue) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldValue
        }))
    }


    // NEW FUNCTION: Handle exercise input fields
    const handleExerciseInput = (field, value) => {
        setCurrentExercise(prev => ({
            ...prev,
            [field]: value
        }));
    };


    // NEW FUNCTION: Add exercise to exercises array
    const addExercise = () => {
        if (!currentExercise.name || (!currentExercise.reps && !currentExercise.time)) {
            ToastAndroid.show('Please enter exercise name and reps/time', ToastAndroid.SHORT);
            return;
        }
        
        setExercises([...exercises, currentExercise]);
        setCurrentExercise({
            name: '',
            reps: null,
            time: null
        });
    };


    // NEW FUNCTION: Remove exercise from list
    const removeExercise = (index) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const onSubmit = () => {
        if (!formData.title || !formData.category || !formData.est_time || !image) {
            ToastAndroid.show('Please Enter All Details', ToastAndroid.SHORT)
            return;
        }
        if (exercises.length === 0) {
            ToastAndroid.show('Please Add At Least One Exercise', ToastAndroid.SHORT)
            return;
        }
        UploadImage();
    }


    // uploads workout image (local url -> fetch) to Firebase Storage, then get a public imageUrl from it, 
    // then save the url along with the rest of form data into Firestore
    const UploadImage = async() => {
        setLoader(true)
        const resp = await fetch(image);
        const blobImage = await resp.blob();
        const storageRef = ref(storage,'/Tidally/'+Date.now()+'.jpg');
        console.log(storageRef)
        uploadBytes(storageRef,blobImage).then((snapshot) => {
            console.log('File Uploaded')
        }).then(resp => {
            getDownloadURL(storageRef).then(async(downloadUrl) => {
                console.log(downloadUrl);
                SaveFormData(downloadUrl)   
            })
        })
    }


    const SaveFormData = async(imageUrl) => {
        const docId = Date.now().toString(); 
        await setDoc(doc(db,'Routines',docId), {   // creates a document with specified id
            ...formData,
            user: {
                email: user?.primaryEmailAddress?.emailAddress,
                imageUrl: user?.imageUrl,
                name: user?.fullName
            },
            imageUrl: imageUrl,
            exercises: exercises, // NEW: Adding exercises array to Firestore
            id: docId
        })
        setLoader(false);
        router.replace('/(tabs)/home')
    }


    // NEW COMPONENT: Exercise Input UI
    const ExerciseInputUI = () => (
        <View>
            <Text style={{
                fontFamily: 'outfit-medium',
                fontSize: 18,
                marginTop: 20,
                marginBottom: 10
            }}>Add Exercises</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Exercise Name *</Text>
                <TextInput 
                    style={styles.input}
                    value={currentExercise.name}
                    onChangeText={(value) => handleExerciseInput('name', value)}
                    placeholder="Enter exercise name"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Measurement Type *</Text>
                <Picker
                    selectedValue={measurementType}
                    style={styles.input}
                    onValueChange={(value) => {
                        setMeasurementType(value);
                        setCurrentExercise(prev => ({
                            ...prev,
                            reps: null,
                            time: null
                        }));
                    }}>
                    <Picker.Item label="Reps" value="reps" />
                    <Picker.Item label="Time (s)" value="time" />
                </Picker>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>
                    {measurementType === 'reps' ? 'Reps *' : 'Time (s) *'}
                </Text>
                <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={measurementType === 'reps' ? 
                        currentExercise.reps?.toString() : 
                        currentExercise.time?.toString()}
                    onChangeText={(value) => {
                        const numValue = parseInt(value);
                        handleExerciseInput(
                            measurementType === 'reps' ? 'reps' : 'time',
                            isNaN(numValue) ? null : numValue
                        );
                    }}
                    placeholder={measurementType === 'reps' ? 
                        "Enter number of reps" : 
                        "Enter time in seconds"}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: Colors.light.secondary }]}
                onPress={addExercise}>
                <Text style={{fontFamily: 'outfit-medium', textAlign: 'center', color: '#fff'}}>
                    Add Exercise
                </Text>
            </TouchableOpacity>

            {exercises.length > 0 && (
                <View style={styles.exerciseList}>
                    <Text style={[styles.label, {marginBottom: 10}]}>Added Exercises:</Text>
                    {exercises.map((exercise, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.exerciseItem}
                            onLongPress={() => removeExercise(index)}>
                            <Text style={styles.exerciseText}>
                                {exercise.name} - {exercise.reps ? 
                                    `${exercise.reps} reps` : 
                                    `${exercise.time} seconds`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <Text style={[styles.label, {fontSize: 12, marginTop: 5, color: Colors.light.gray}]}>
                        Long press an exercise to remove it
                    </Text>
                </View>
            )}
        </View>
    );


    return (
        <ScrollView style={{
            padding: 20
        }}>
            <Text style={{
                fontFamily: 'outfit-medium',
                fontSize: 20
            }}>Create New Workout</Text>

            <Pressable onPress={imagePicker}>
                <Text style={styles.label}>Select Image *</Text>
                {!image? <Image source={require('./../../assets/images/placeholder.webp')}
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: 15, 
                        borderWidth: 1,
                        borderColor: Colors.light.lightGray
                    }}/> :
                    <Image source={{uri: image}}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 15, 
                        }} />}
            </Pressable>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Workout Name *</Text>
                <TextInput style={styles.input} 
                    onChangeText={(value) => handleInputChange('title',value)} /> 
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Choose Folder *</Text>
                <Picker
                    selectedValue={selectedCategory} 
                    style={styles.input}
                    onValueChange={(itemValue, itemIndex) => {
                        setSelectedCategory(itemValue);
                        handleInputChange('category',itemValue)}}>

                    {categoryList.map((category,index) => (
                        <Picker.Item key={index} label={category.name} value={category.name} />
                    ))}
                </Picker>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Est. Duration (min) *</Text>
                <TextInput style={styles.input} 
                    keyboardType='number-pad'
                    onChangeText={(value) => handleInputChange('est_time',value)} />
            </View>

            {/* NEW: Add Exercise Input UI */}
            {ExerciseInputUI()}

            <TouchableOpacity
                style={styles.button}
                disabled={loader} 
                onPress={onSubmit}>
                {loader ? 
                    <ActivityIndicator size={'large'} /> :
                    <Text style={{fontFamily: 'outfit-medium', textAlign: 'center', color: '#fff'}}>
                        Submit
                    </Text>
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
    },

    // NEW STYLES
    exerciseList: {
        marginVertical: 15,
        padding: 10,
        backgroundColor: Colors.light.background,
        borderRadius: 7,
    },
    exerciseItem: {
        padding: 10,
        backgroundColor: '#fff',
        marginVertical: 5,
        borderRadius: 5,
        elevation: 2,
    },
    exerciseText: {
        fontFamily: 'outfit',
    }
});