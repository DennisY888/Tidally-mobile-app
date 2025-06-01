// components/Home/Folder.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './../../config/FirebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

export default function Folder({ category }) {
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');
  
  useEffect(() => {
    GetCategories();
  }, []);
  
  const GetCategories = async() => {
    setLoading(true);
    setCategoryList([]);
    try {
      const snapshot = await getDocs(collection(db, 'Category'));
      const data = snapshot.docs.map(doc => doc.data());
      setCategoryList(data);
      
      if (data.length > 0) {
        setSelectedCategory(data[0].name);
        category(data[0].name);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCategorySelect = (item) => {
    setSelectedCategory(item.name);
    category(item.name);
  };


  // Chunk data into groups of 4 for 2×2 grid
  const chunkedCategories = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < categoryList.length; i += 6) {  
      chunks.push(categoryList.slice(i, i + 6));
    }
    return chunks;
  }, [categoryList]);


  const renderPremiumCategoryItem = (item, globalIndex) => {
    if (!item) {
      // Empty placeholder for incomplete rows
      return <View style={styles.categoryCard} key={`empty-${globalIndex}`} />;
    }
    
    const isSelected = selectedCategory === item.name;
    
    return (
      <TouchableOpacity
        key={item.name || `category-${globalIndex}`}
        style={styles.categoryCard}
        onPress={() => handleCategorySelect(item)}
        activeOpacity={0.85}
      >
        <MotiView
          animate={{
            scale: isSelected ? 1.02 : 1,
            opacity: isSelected ? 1 : 0.95,
          }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
          }}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={
              isSelected
                ? [Colors.light.primary, Colors.light.secondary, Colors.light.accent]
                : [Colors.light.backgroundSecondary, Colors.light.background]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainerLarge}>
              {item?.imageUrl ? (
                <Image
                  source={{ uri: item?.imageUrl }}
                  style={styles.categoryImageLarge}
                />
              ) : (
                <Ionicons 
                  name="folder" 
                  size={40}
                  color={isSelected ? '#fff' : Colors.light.textSecondary} 
                />
              )}
            </View>
            
            <Text 
              style={[
                styles.categoryTextLarge,
                isSelected && styles.selectedCategoryTextLarge
              ]}
              numberOfLines={2}
            >
              {item?.name}
            </Text>
          </LinearGradient>
        </MotiView>
      </TouchableOpacity>
    );
  };

  
  // Placeholder items for loading state
  const renderPlaceholder = () => {
    return Array(4).fill(0).map((_, index) => (
      <View key={index} style={styles.itemWrapper}>
        <View style={[styles.container, styles.placeholderContainer]}>
          <View style={styles.placeholderImage} />
          <View style={styles.placeholderText} />
        </View>
      </View>
    ));
  };
  
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Categories</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={GetCategories}>
          <Ionicons name="refresh" size={16} color={Colors.light.primary} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.placeholderWrapper}>
          {renderPlaceholder()}
        </View>
      ) : (
        <ScrollView 
          horizontal 
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.scrollContainer}
        >
          {chunkedCategories.map((chunk, pageIndex) => (
            <View key={`page-${pageIndex}`} style={styles.pageContainer}>
              {/* First row */}
              <View style={styles.gridRow}>
                {chunk.slice(0, 3).map((item, index) => 
                  renderPremiumCategoryItem(item, pageIndex * 6 + index)
                )}
              </View>
              {/* Second row */}
              <View style={styles.gridRow}>
                {chunk.slice(3, 6).map((item, index) => 
                  renderPremiumCategoryItem(item, pageIndex * 6 + index + 3)
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerText: {
    ...Typography.title2,
    color: Colors.light.text,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshText: {
    ...Typography.subhead,
    color: Colors.light.primary,
    marginLeft: 4,
  },
  placeholderWrapper: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  placeholderContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    opacity: 0.7,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.divider,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.divider,
  },
  emptyContainer: {
    width: Dimensions.get('window').width - Spacing.md * 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.callout,
    color: Colors.light.textTertiary,
    marginTop: Spacing.sm,
  },
  scrollContainer: {
    paddingVertical: Spacing.lg,
  },
  pageContainer: {
    width: Dimensions.get('window').width,
    paddingHorizontal: Spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  categoryCard: {
    width: (Dimensions.get('window').width - (Spacing.lg * 2) - (Spacing.md * 2)) / 3,
    aspectRatio: 1.0,  
    borderRadius: BorderRadius.lg,  
    overflow: 'hidden',
    ...Shadows.medium,  
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  iconContainerLarge: {
    width: 60,   
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryImageLarge: {
    width: 36,   
    height: 36,
    borderRadius: 18,
  },
  categoryTextLarge: {
    ...Typography.callout,  
    textAlign: 'center',
    color: Colors.light.text,
    fontFamily: 'outfit-medium',
  },
  selectedCategoryTextLarge: {
    color: '#fff',
    fontFamily: 'outfit-bold',
  },
});