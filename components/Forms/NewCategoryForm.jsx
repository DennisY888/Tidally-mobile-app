// components/Forms/NewCategoryForm.jsx
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { useTheme } from '../../context/ThemeContext';
import { db, storage } from '../../config/FirebaseConfig';
import FormField from './FormField';
import ActionButton from '../UI/ActionButton';
import { Spacing, BorderRadius, Typography, Colors } from '../../constants/Colors';
import { showToast } from '../../utils/helpers';


/**
 * A reusable form for creating a new Category (Folder).
 * It handles image picking, text input, and submission.
 * @param {Object} props - Component props
 * @param {Function} props.onCategoryCreated - A callback function to run after successful creation.
 */
export default function NewCategoryForm({ onCategoryCreated }) {
  const { colors } = useTheme();
  const { user } = useUser();
  const [image, setImage] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loader, setLoader] = useState(false);

  /**
   * Opens the device's image library to select an icon for the category.
   */
  const imagePicker = async () => {
    // Request permission if not already granted
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showToast("Permission to access photos is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Enforce a square aspect ratio for icons
      quality: 0.7,    // Compress the image to save storage and upload time
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  /**
   * Handles the entire category creation process: validation, image upload, and Firestore document creation.
   */
  const handleCreate = async () => {
    // 1. Validate input: Ensure all required fields are filled.
    if (!categoryName.trim() || !image) {
      showToast('Please provide a name and an icon for the folder.');
      return;
    }
    setLoader(true);

    try {
      // 2. Upload Image: Fetch the image data and upload it to Firebase Storage.
      // The path is organized by user ID for security and easy management.
      const resp = await fetch(image);
      const blobImage = await resp.blob();
      const storageRef = ref(storage, `category-icons/${user.id}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blobImage);
      const downloadUrl = await getDownloadURL(storageRef);

      // 3. Create Firestore Document: Once the image is uploaded, create the category
      // document with the image URL and user's email for ownership.
      await addDoc(collection(db, 'Category'), {
        name: categoryName.trim(),
        imageUrl: downloadUrl,
        userEmail: user.primaryEmailAddress.emailAddress, // <-- Critical for security
      });
      
      showToast('Folder created successfully!');

      // 4. Callback: Notify the parent component that creation was successful.
      // The parent component is responsible for closing the form and refreshing its data.
      if (onCategoryCreated) {
        onCategoryCreated();
      }

    } catch (error) {
      console.error("Error creating category:", error);
      showToast("Failed to create folder. Please try again.");
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.divider }]}>
      <TouchableOpacity onPress={imagePicker} style={[styles.imagePicker, { backgroundColor: colors.background, borderColor: colors.divider }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={30} color={colors.textTertiary} />
              <Text style={[styles.placeholderText, {color: colors.textSecondary}]}>Icon</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.formContent}>
        <FormField
          label="Folder Name"
          placeholder="e.g., 'Leg Day'"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <ActionButton
          title="Create"
          onPress={handleCreate}
          loading={loader}
          disabled={loader}
          style={{ marginTop: 0 }} // Override default margin for compact layout
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  imagePicker: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden', // Ensures the Image component respects the border radius
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    ...Typography.caption1,
    marginTop: Spacing.xs,
  },
  formContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});