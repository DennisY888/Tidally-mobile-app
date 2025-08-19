// app/add-new-workout/index.jsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ToastAndroid, 
  Animated,
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDocs, setDoc, serverTimestamp, addDoc, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useUser } from '@clerk/clerk-expo';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { db, storage } from '../../config/FirebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import FormField from '../../components/Forms/FormField';
import ExerciseItem from '../../components/Workout/ExerciseItem';
import ActionButton from '../../components/UI/ActionButton';
import AnimatedHeader from '../../components/UI/AnimatedHeader';
import { showToast } from '../../utils/helpers';


/**
 * Add New Workout Screen
 * 
 * Allows users to create a new workout by adding details and exercises
 */
export default function AddNewWorkout() {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  
  // Form state
  const [formData, setFormData] = useState({});
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [image, setImage] = useState();
  const [loader, setLoader] = useState(false);
  
  // Exercise state
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState({
    name: '',
    reps: null,
    time: null,
    sets: null
  });
  const [measurementType, setMeasurementType] = useState('reps');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;
  
  // Setup on component mount
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
    
    getCategories();
    
    // Animate form appearance
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);
  
  /**
   * Fetch categories from Firestore
   */
  const getCategories = async() => {
    setCategoryList([]);
    try {
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.log("No user found, cannot fetch categories.");
        return;
      }
      
      const q = query(
        collection(db, 'Category'),
        where('userEmail', '==', user.primaryEmailAddress.emailAddress)
      );
      const snapshot = await getDocs(q);
      const categories = [];
      snapshot.forEach((doc) => {
        categories.push(doc.data());
      });
      setCategoryList(categories);
      
      if (categories.length > 0) {
        setSelectedCategory(categories[0].name);
        handleInputChange('category', categories[0].name);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Failed to load categories");
    }
  };
  
  /**
   * Launch image picker to select workout image
   */
  const imagePicker = async() => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      showToast("Failed to select image");
    }
  };
  
  /**
   * Update form data state
   * @param {string} fieldName - Form field name
   * @param {string|number} fieldValue - Form field value
   */
  const handleInputChange = (fieldName, fieldValue) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
  };
  
  /**
   * Update current exercise being edited
   * @param {string} field - Exercise field name
   * @param {string|number} value - Exercise field value
   */
  const handleExerciseInput = (field, value) => {
    setCurrentExercise(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  /**
   * Add current exercise to the list
   */
  const addExercise = () => {
    if (!currentExercise.name || (!currentExercise.reps && !currentExercise.time) || !currentExercise.sets) {
      showToast('Please enter exercise name, reps/time, and sets');
      return;
    }
    
    setExercises([...exercises, currentExercise]);
    setCurrentExercise({
      name: '',
      reps: null,
      time: null,
      sets: null
    });
  };
  
  /**
   * Remove exercise from the list
   * @param {number} index - Index of exercise to remove
   */
  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };
  
  /**
   * Validate form and start upload process
   */
  const onSubmit = () => {
    if (!formData.title || !formData.category || !formData.est_time || !image) {
      showToast('Please Enter All Details');
      return;
    }
    if (exercises.length === 0) {
      showToast('Please Add At Least One Exercise');
      return;
    }
    uploadImage();
  };
  
  /**
   * Upload workout image to Firebase Storage
   */
  const uploadImage = async() => {
    setLoader(true);
    try {
      const compressedImage = await manipulateAsync(
        image,
        [{ resize: { width: 1024 } }], // Resize to max 1024px width
        { 
          compress: 0.8, // 80% quality
          format: SaveFormat.JPEG 
        }
      );
      
      const resp = await fetch(compressedImage.uri);
      const blobImage = await resp.blob();
      const storageRef = ref(storage, '/Tidally/' + Date.now() + '.jpg');
      
      await uploadBytes(storageRef, blobImage);
      const downloadUrl = await getDownloadURL(storageRef);
      await saveFormData(downloadUrl);
    } catch (error) {
      console.error("Upload error:", error);
      setLoader(false);
      showToast("Failed to upload image");
    }
  };
  
  /**
   * Save workout data to Firestore
   * @param {string} imageUrl - URL of uploaded image
   */
  const saveFormData = async(imageUrl) => {
    try {
      const docId = Date.now().toString();
      await setDoc(doc(db, 'Routines', docId), {
        ...formData,
        user: {
          email: user?.primaryEmailAddress?.emailAddress,
          imageUrl: user?.imageUrl,
          name: user?.fullName
        },
        imageUrl: imageUrl,
        exercises: exercises,
        id: docId,
        createdAt: serverTimestamp()
      });
      
      setLoader(false);
      showToast("Workout created successfully!");
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error("Save data error:", error);
      setLoader(false);
      showToast("Failed to save workout");
    }
  };

  
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Animated Header */}
      <AnimatedHeader 
        title="New Workout"
        scrollY={scrollY}
        onBackPress={() => router.back()}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View 
          style={[
            styles.formContainer,
            { 
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
              backgroundColor: colors.background
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Create New Workout</Text>
          
          {/* Image Picker */}
          <View style={styles.imagePickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Cover Image *</Text>
            <Pressable 
              onPress={imagePicker}
              style={[styles.imagePicker, { borderColor: colors.divider }]}
            >
              {!image ? (
                <View style={[styles.placeholderImage, { backgroundColor: colors.lightGray }]}>
                  <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to select image
                  </Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: image }}
                  style={styles.selectedImage}
                />
              )}
            </Pressable>
          </View>
          
          {/* Workout Name */}
          <FormField
            label="Workout Name *"
            placeholder="Enter workout name"
            onChangeText={(value) => handleInputChange('title', value)}
          />
          
          {/* Category Selector */}
          <View style={styles.inputContainer}>
            {/* This new container allows the label and button to sit side-by-side. */}
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
            </View>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.divider 
            }]}>
              <Picker
                selectedValue={selectedCategory}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.primary}
                onValueChange={(itemValue) => {
                  setSelectedCategory(itemValue);
                  handleInputChange('category', itemValue);
                }}
              >
                {categoryList.map((category, index) => (
                  <Picker.Item 
                    key={index} 
                    label={category.name} 
                    value={category.name}
                    color={Platform.OS === 'ios' ? colors.text : undefined}
                  />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Duration */}
          <FormField
            label="Est. Duration (min) *"
            placeholder="Enter estimated duration in minutes"
            keyboardType="number-pad"
            onChangeText={(value) => handleInputChange('est_time', value)}
          />
          
          {/* Exercises Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Exercises</Text>
            
            {/* Exercise Name */}
            <FormField
              label="Exercise Name *"
              placeholder="Enter exercise name"
              value={currentExercise.name}
              onChangeText={(value) => handleExerciseInput('name', value)}
            />
            
            {/* Measurement Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Measurement Type *</Text>
              <View style={[styles.pickerContainer, { 
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.divider 
              }]}>
                <Picker
                  selectedValue={measurementType}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.primary}
                  onValueChange={(value) => {
                    setMeasurementType(value);
                    setCurrentExercise(prev => ({
                      ...prev,
                      reps: null,
                      time: null
                    }));
                  }}
                >
                  <Picker.Item 
                    label="Repetitions (Reps)" 
                    value="reps" 
                    color={Platform.OS === 'ios' ? colors.text : undefined} 
                  />
                  <Picker.Item 
                    label="Duration (Seconds)" 
                    value="time" 
                    color={Platform.OS === 'ios' ? colors.text : undefined} 
                  />
                </Picker>
              </View>
            </View>
            
            {/* Reps or Time Input */}
            <FormField
              label={measurementType === 'reps' ? 'Repetitions *' : 'Duration (seconds) *'}
              placeholder={measurementType === 'reps' ? 
                "Enter number of repetitions" : 
                "Enter time in seconds"}
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
            />
            
            {/* Sets Input */}
            <FormField
              label="Sets *"
              placeholder="Enter number of sets"
              keyboardType="number-pad"
              value={currentExercise.sets?.toString()}
              onChangeText={(value) => {
                const numValue = parseInt(value);
                handleExerciseInput('sets', isNaN(numValue) ? null : numValue);
              }}
            />
            
            {/* Add Exercise Button */}
            <ActionButton
              title="Add Exercise"
              icon="add-circle"
              color={colors.secondary}
              onPress={addExercise}
            />
            
            {/* Exercise List */}
            {exercises.length > 0 && (
              <View style={styles.exerciseList}>
                <Text style={[styles.exerciseListTitle, { color: colors.text }]}>
                  Exercise List
                </Text>
                <Text style={[styles.exerciseListHint, { color: colors.textTertiary }]}>
                  Long press an exercise to remove it
                </Text>
                
                <View style={styles.exerciseItems}>
                  {exercises.map((exercise, index) => (
                    <ExerciseItem
                      key={index}
                      exercise={exercise}
                      index={index}
                      onLongPress={() => removeExercise(index)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
          
          {/* Submit Button */}
          <ActionButton
            title="Create Workout"
            icon="checkmark-circle"
            disabled={loader}
            loading={loader}
            onPress={onSubmit}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: 90, // Header offset
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  sectionTitle: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  imagePickerContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.subhead,
    marginBottom: Spacing.xs,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.callout,
    marginTop: Spacing.sm,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    ...Typography.body,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  exerciseList: {
    marginTop: Spacing.xl,
  },
  exerciseListTitle: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  exerciseListHint: {
    ...Typography.caption1,
    marginBottom: Spacing.md,
  },
  exerciseItems: {
    marginTop: Spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4, // Makes the touch target larger for better UX
  },
  addButtonText: {
    ...Typography.subhead,
    marginLeft: 4,
    fontFamily: 'outfit-medium', // Use medium weight for emphasis
  },
});