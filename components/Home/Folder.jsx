// components/Home/Folder.jsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Dimensions
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
  
  const renderCategoryItem = ({ item, index }) => {
    const isSelected = selectedCategory === item.name;
    const inputRange = [
      (index - 1) * (width / 4),
      index * (width / 4),
      (index + 1) * (width / 4),
    ];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 1.05, 0.95],
      extrapolate: 'clamp',
    });
    
    return (
      <TouchableOpacity
        onPress={() => handleCategorySelect(item)}
        style={styles.itemWrapper}
        activeOpacity={0.8}
      >
        <MotiView
          animate={{
            scale: isSelected ? 1.05 : 0.95,
            opacity: isSelected ? 1 : 0.8,
          }}
          transition={{
            type: 'timing',
            duration: 300,
          }}
        >
          <LinearGradient
            colors={
              isSelected
                ? [Colors.light.primary, Colors.light.secondary]
                : [Colors.light.backgroundSecondary, Colors.light.background]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.container,
              isSelected && styles.selectedContainer
            ]}
          >
            <View style={styles.iconContainer}>
              {item?.imageUrl ? (
                <Image
                  source={{ uri: item?.imageUrl }}
                  style={styles.categoryImage}
                />
              ) : (
                <Ionicons 
                  name="folder" 
                  size={30} 
                  color={isSelected ? '#fff' : Colors.light.textSecondary} 
                />
              )}
            </View>
            
            <Text 
              style={[
                styles.categoryText,
                isSelected && styles.selectedCategoryText
              ]}
              numberOfLines={1}
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
        <Animated.FlatList
          data={categoryList}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderCategoryItem}
          keyExtractor={(item, index) => `category-${index}`}
          contentContainerStyle={styles.listContainer}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={width / 4}
          snapToAlignment="center"
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open" size={32} color={Colors.light.textTertiary} />
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          )}
        />
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
  listContainer: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  itemWrapper: {
    paddingHorizontal: 8,
    width: Dimensions.get('window').width / 4,
  },
  container: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.small,
  },
  selectedContainer: {
    ...Shadows.medium,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  categoryText: {
    ...Typography.footnote,
    textAlign: 'center',
    color: Colors.light.text,
    marginTop: 4,
  },
  selectedCategoryText: {
    color: '#fff',
    fontFamily: 'outfit-medium',
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
});