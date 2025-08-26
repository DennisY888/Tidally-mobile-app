// components/Home/Folder.jsx

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Animated, Dimensions, ScrollView } from 'react-native';
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
import FolderActionsModal from './FolderActionsModal'; 

const { width: screenWidth } = Dimensions.get('window');

const chunkArray = (array, size) => {
  const chunkedArr = [];
  let index = 0;
  while (index < array.length) {
    chunkedArr.push(array.slice(index, size + index));
    index += size;
  }
  return chunkedArr;
};

export default function Folder({ category, user }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const scaleAnims = useRef(categoryList.map(() => new Animated.Value(1))).current;
  const [paginatedCategories, setPaginatedCategories] = useState([]);

  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);

  const getCategories = useCallback(async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setCategoryList([]);
      setPaginatedCategories([]);
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
      setPaginatedCategories(chunkArray(data, 6)); 
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCategoryLongPress = useCallback((item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveFolder(item);
    setIsFolderModalVisible(true);
  }, []);

  // ==================== ROOT IMPLEMENTATION START ====================
  const handleSaveName = async (newName) => {
    if (!activeFolder || !user) return;
    const success = await WorkoutService.updateCategoryName(activeFolder.name, newName, user.primaryEmailAddress.emailAddress);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedCategory === activeFolder.name) {
        setSelectedCategory(newName);
        category(newName);
      }
      getCategories();
    } else {
      Alert.alert("Error", "Failed to rename folder. A folder with that name may already exist.");
    }
    setIsFolderModalVisible(false); // Close the modal on save
    setActiveFolder(null);
  };


  const handleChangeImage = async () => {
    if (!activeFolder || !user) return;

    setIsFolderModalVisible(false); 

    const success = await WorkoutService.updateCategoryImage(activeFolder.id, user.id);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      getCategories(); 
    }
    
    setActiveFolder(null);
  };

  
  const handleDelete = () => {
    if (!activeFolder || !user) return;
    setIsFolderModalVisible(false); // Close the modal before showing the Alert
    
    Alert.alert(
      "Delete Folder",
      `Are you sure you want to delete "${activeFolder.name}"? All workouts inside will also be deleted. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setActiveFolder(null) },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await WorkoutService.deleteCategory(activeFolder.name, user.primaryEmailAddress.emailAddress);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (selectedCategory === activeFolder.name) {
                setSelectedCategory('');
                category('');
              }
              getCategories();
            } else {
              Alert.alert("Error", "Failed to delete folder.");
            }
            setActiveFolder(null);
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (categoryList.length > 0 && !selectedCategory) {
      const firstCategory = categoryList[0].name;
      setSelectedCategory(firstCategory);
      category(firstCategory);
    }
  }, [categoryList, selectedCategory, category]);

  useFocusEffect(
    useCallback(() => {
      getCategories();
    }, [getCategories])
  );
  
  const handleCategorySelect = (item) => {
    setSelectedCategory(item.name);
    category(item.name);
  };


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
                  ? [colors.primary, colors.secondary]
                  : [colors.background, colors.backgroundSecondary]
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
                style={[ styles.categoryTextLarge, { color: isSelected ? '#fff' : colors.text }]}
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
      ) : paginatedCategories.length > 0 ? (
        <View style={styles.scrollViewContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={styles.scrollViewContent}
            snapToAlignment="start"
            snapToInterval={screenWidth}
          >
            {paginatedCategories.map((page, pageIndex) => (
              <View key={`page-${pageIndex}`} style={styles.pageContainer}>
                <View style={styles.gridContainer}>
                  {page.map((item, itemIndex) => renderPremiumCategoryItem(item, itemIndex))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        !showCreateForm && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No folders yet. Tap "Add Folder" to create your first one!</Text>
          </View>
        )
      )}

      <FolderActionsModal
        visible={isFolderModalVisible}
        folder={activeFolder}
        onClose={() => {
          setIsFolderModalVisible(false);
          setActiveFolder(null);
        }}
        onSaveName={handleSaveName}
        onChangeImage={handleChangeImage}
        onDelete={handleDelete}
      />
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
      paddingHorizontal: Spacing.lg,
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
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    scrollViewContainer: {
      marginHorizontal: -Spacing.lg,
    },
    scrollViewContent: {
      paddingHorizontal: Spacing.lg,
    },
    pageContainer: {
      width: screenWidth - (Spacing.lg * 2),
      marginRight: Spacing.lg * 2,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    categoryCard: {
      width: '33.333%',
      padding: Spacing.sm,
      aspectRatio: 1,
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
      marginHorizontal: Spacing.lg,
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