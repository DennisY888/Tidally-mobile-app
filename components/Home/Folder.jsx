// components/Home/Folder.jsx 
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from './../../config/FirebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { WorkoutService } from '../../services/WorkoutService';
import NewCategoryForm from '../Forms/NewCategoryForm';
import { useTheme } from '../../context/ThemeContext';
import { Dimensions, ScrollView } from 'react-native';


  const screenWidth = Dimensions.get('window').width;
  const twoRowsHeight = (screenWidth * 0.33333) * 2;


export default function Folder({ category, user }) {

  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const scaleAnims = useRef(categoryList.map(() => new Animated.Value(1))).current;
  

  // useCallback memoizes the function to prevent unnecessary re-renders.
  const getCategories = useCallback(async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setCategoryList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'Category'),
        where('userEmail', '==', user.primaryEmailAddress.emailAddress)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCategoryList(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    // Only set initial category if we have categories and no category is selected
    if (categoryList.length > 0 && !selectedCategory) {
      const firstCategory = categoryList[0].name;
      setSelectedCategory(firstCategory);
      category(firstCategory); // Propagate to parent
    }
  }, [categoryList, selectedCategory, category]);


  // useFocusEffect is the correct hook for this job. It re-fetches data
  // every time the Home tab comes into focus, ensuring data is always fresh.
  useFocusEffect(
    useCallback(() => {
      getCategories();
    }, [getCategories])
  );
  

  const handleCategorySelect = (item) => {
    setSelectedCategory(item.name);
    category(item.name); // Propagate selection to parent
  };


  const handleCategoryLongPress = useCallback((item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Folder Options",
      `What would you like to do with "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => handleDeleteCategory(item)
        }
      ]
    );
  }, []);
  
  
  const handleDeleteCategory = useCallback(async (item) => {
    Alert.alert(
      "Delete Folder",
      `Are you sure you want to delete "${item.name}"?\n\nWorkouts in this folder will be moved to "Uncategorized".`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              const success = await WorkoutService.deleteCategory(
                item.name,
                user?.primaryEmailAddress?.emailAddress,
                'Uncategorized'
              );
              
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                getCategories(); // Refresh the categories list
              } else {
                Alert.alert("Error", "Failed to delete folder. Please try again.");
              }
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete folder. Please try again.");
            }
          }
        }
      ]
    );
  }, [user, getCategories]);


  const renderPremiumCategoryItem = (item, index) => {
    const isSelected = selectedCategory === item.name;
    return (
        <TouchableOpacity
          key={item.id || index}
          style={styles.categoryCard}
          onPress={() => handleCategorySelect(item)}
          onLongPress={() => handleCategoryLongPress(item)}
          activeOpacity={0.85}
        >
          <MotiView
            animate={{ scale: isSelected ? 1.05 : 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{flex: 1}}
          >
            <LinearGradient
              colors={
                isSelected
                  ? [colors.primary, colors.secondary] // ✅ USE THEME COLORS
                  : [colors.background, colors.backgroundSecondary] // ✅ USE THEME COLORS
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainerLarge}>
                {item?.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.categoryImageLarge} />
                ) : (
                  <Ionicons name="folder" size={40} color={isSelected ? '#fff' : colors.textSecondary} /> 
                )}
              </View>
              <Text 
                style={[ styles.categoryTextLarge, { color: isSelected ? '#fff' : colors.text }]} // ✅ USE THEME COLOR
                numberOfLines={2}
              >
                {item?.name}
              </Text>
            </LinearGradient>
          </MotiView>
        </TouchableOpacity>
    );
  };

  
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateForm(prev => !prev)}>
          <Ionicons name={showCreateForm ? 'close-circle' : 'add-circle'} size={24} color={Colors.light.primary} />
          <Text style={styles.addButtonText}>{showCreateForm ? 'Cancel' : 'Add Folder'}</Text>
        </TouchableOpacity>
      </View>

      {showCreateForm && (
        <View style={styles.formWrapper}>
          <NewCategoryForm 
            onCategoryCreated={() => {
              setShowCreateForm(false);
              getCategories();
            }} 
          />
        </View>
      )}

      {loading ? (
        <View style={styles.gridContainer}>
          {Array(6).fill(0).map((_, index) => (
            <View key={`placeholder-${index}`} style={[styles.categoryCard, styles.placeholderContainer]} />
          ))}
        </View>
      ) : categoryList.length > 0 ? (
          <View style={styles.gridContainer}>
            {categoryList.map((item, index) => renderPremiumCategoryItem(item, index))}
          </View>
      ) : (
        !showCreateForm && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No folders yet. Tap "Add Folder" to create your first one!</Text>
          </View>
        )
      )}
    </View>
  );
}


const getStyles = (colors, isDark) => StyleSheet.create({
    wrapper: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
    },
    headerText: {
      ...Typography.title2,
      color: colors.text, 
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    addButtonText: {
      ...Typography.subhead,
      color: colors.primary, 
      marginLeft: Spacing.sm,
      fontFamily: 'outfit-medium',
    },
    formWrapper: {
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.sm,
    },
    categoryCard: {
      width: '33.333%',
      padding: Spacing.sm,
      aspectRatio: 1,
      transform: [{ scale: 1 }],
    },
    cardGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
      ...Shadows[isDark ? 'dark' : 'light'].medium, 
    },
    iconContainerLarge: {
      width: 48,   
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    categoryImageLarge: {
      width: '100%',   
      height: '100%',
      borderRadius: 24,
    },
    categoryTextLarge: {
      ...Typography.caption1,
      textAlign: 'center',
      fontFamily: 'outfit-medium',
    },
    placeholderContainer: {
      backgroundColor: colors.backgroundSecondary, 
      borderRadius: BorderRadius.lg,
    },
    emptyContainer: {
      marginHorizontal: Spacing.md,
      padding: Spacing.xl,
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary, 
      borderRadius: BorderRadius.lg,
    },
    emptyText: {
      ...Typography.body,
      textAlign: 'center',
      color: colors.textSecondary, 
    },
});