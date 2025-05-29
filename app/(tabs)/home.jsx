// app/(tabs)/home.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  RefreshControl,
  Animated,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Image
} from 'react-native';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';

import { useTheme } from '../../context/ThemeContext';
import { db } from '../../config/FirebaseConfig';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import Header from '../../components/Home/Header';
import Slider from '../../components/Home/Slider';
import Folder from '../../components/Home/Folder';
import Workout from '../../components/Home/Workout';
import SectionHeader from '../../components/UI/SectionHeader';
import EmptyState from '../../components/UI/EmptyState';
import { WorkoutService } from '../../services/WorkoutService';
import { debounce } from 'lodash';


const WorkoutItem = React.memo(({ workout, index }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        delay: Math.min(index, 5) * 70, // Cap delay at 5 items, reduce delay time
        type: 'timing',
        skipExitAnimation: true
      }}
    >
      <Workout workout={workout} />
    </MotiView>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary rerenders
  return prevProps.workout.id === nextProps.workout.id && 
         prevProps.workout.updatedAt === nextProps.workout.updatedAt;
});



/**
 * Home Screen
 * 
 * Main navigation hub for the app displaying various workout collections:
 * - Featured workouts in a slider
 * - Category-based workouts
 * - User's recent workouts
 */
export default function Home() {
  // State management
  const [workouts, setWorkouts] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [popularWorkouts, setPopularWorkouts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Hooks
  const { user } = useUser();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;


  // Add this helper function for smooth data updates
  const mergeWorkouts = (newData, prevData) => {
    // Guard against undefined newData
    if (!newData) {
      return prevData || [];
    }
    
    // Guard against undefined prevData
    if (!prevData) {
      return newData;
    }
    
    // Create a map of existing workouts for quick lookup
    const existingWorkoutsMap = new Map(
      prevData.map(workout => [workout.id, workout])
    );
    
    // Create updated list with smooth transitions
    return newData.map(newWorkout => {
      const existingWorkout = existingWorkoutsMap.get(newWorkout.id);
      // If workout exists, preserve reference but update fields
      if (existingWorkout) {
        return { ...existingWorkout, ...newWorkout };
      }
      // Otherwise use new workout
      return newWorkout;
    });
  };


  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term || term.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      try {
        const { workouts } = await WorkoutService.searchWorkouts(term);
        setSearchResults(workouts);
        setIsSearching(term.trim() !== '');
      } catch (error) {
        console.error("Error in search:", error);
        // Show empty results rather than a broken UI
        setSearchResults([]);
      }
    }, 300), // 300ms is a common debounce time for search inputs
    []
  );
  

  // Handler for search input
  const handleSearch = useCallback((text) => {
    setSearchTerm(text);
    debouncedSearch(text);
  }, [debouncedSearch]);
  

  // Clean up debounce on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  
  // Load initial data on component mount
  useEffect(() => {
    // First load cached data immediately
    loadCachedData();
    
    // Then fetch fresh data in the background
    setIsBackgroundRefreshing(true);
    loadInitialData();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // When returning to this screen, refresh in the background
      setIsBackgroundRefreshing(true);
      refreshDataSilently();
    });
    
    return unsubscribe;
  }, [navigation, selectedCategory]);  // Add selectedCategory to dependencies
  

  /**
   * Loads all initial workout data from Firestore
   */
  const loadInitialData = async () => {
  // Only show loading indicator for initial loads, not background refreshes
  if (!isBackgroundRefreshing) {
    setLoading(true);
  }
  
  try {
    await Promise.all([
      loadRecentWorkouts(),
      loadPopularWorkouts()
    ]);
  } catch (error) {
    console.error("Error loading initial data:", error);
  } finally {
    setLoading(false);
    setIsBackgroundRefreshing(false);
  }
};


  const loadCachedData = useCallback(async () => {
    try {
      // 1. Get all cache keys at once
      const keys = [
        'cached_recent_workouts', 
        'cached_popular_workouts', 
        selectedCategory ? `cached_category_${selectedCategory}` : null
      ].filter(Boolean); // Remove null values
      
      // 2. Use multiGet for batch operations
      const cachedResults = await AsyncStorage.multiGet(keys);
      
      // 3. Process results with cache validation
      for (const [key, value] of cachedResults) {
        if (!value) continue;
        
        try {
          const parsed = JSON.parse(value);
          
          // 4. Check cache expiration (1 hour)
          if (!parsed.timestamp || (Date.now() - parsed.timestamp >= 3600000)) {
            console.log(`Cache expired for ${key}`);
            continue; // Skip expired cache
          }
          
          // 5. Set state based on the cache type
          if (key === 'cached_recent_workouts') {
            setRecentWorkouts(parsed.data || []);
          } else if (key === 'cached_popular_workouts') {
            setPopularWorkouts(parsed.data || []);
            
            // Initialize category if needed (preserving existing logic)
            if (!selectedCategory && parsed.data?.length > 0) {
              setSelectedCategory(parsed.data[0].category);
            }
          } else if (key.startsWith('cached_category_')) {
            setWorkouts(parsed.data || []);
          }
        } catch (e) {
          console.error(`Error parsing cached data for ${key}:`, e);
        }
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  }, [selectedCategory]);


  
  const saveToCache = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error(`Error caching ${key}:`, error);
    }
  };
  

  /**
   * Loads user's recent workouts from Firestore
   */
  const loadRecentWorkouts = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      const { workouts: recentData } = await WorkoutService.getWorkouts({
        userEmail: user.primaryEmailAddress.emailAddress,
        orderByField: 'id',
        limit: 10
      });
      
      setRecentWorkouts(prevWorkouts => mergeWorkouts(recentData, prevWorkouts));
      
      // Cache the data
      await saveToCache('cached_recent_workouts', recentData);
    } catch (error) {
      console.error("Error loading recent workouts:", error);
    }
  };
  

  /**
   * Loads popular workouts from Firestore
   * Note: This is a simplified implementation. In a real app, 
   * you'd track favorites count in the workout document
   */
  const loadPopularWorkouts = async () => {
    try {
      const { workouts: popularData } = await WorkoutService.getWorkouts({
        orderByField: 'id',
        limit: 10
      });
      
      setPopularWorkouts(prevWorkouts => mergeWorkouts(popularData, prevWorkouts));
      
      // Cache the data
      await saveToCache('cached_popular_workouts', popularData);
      
      return popularData;
    } catch (error) {
      console.error("Error loading popular workouts:", error);
      return [];
    }
  };
  
  

  /**
   * Fetches workouts filtered by category
   * @param {string} category - The category to filter by
   */
  const getWorkoutsByCategory = async (category) => {
    if (!category) return;
    
    try {
      const { workouts: categoryData } = await WorkoutService.getWorkouts({
        category,
        orderByField: 'id',
        limit: 10
      });
      
      setWorkouts(prevWorkouts => mergeWorkouts(categoryData, prevWorkouts));
      
      // Cache the data
      await saveToCache(`cached_category_${category}`, categoryData);
    } catch (error) {
      console.error(`Error loading workouts for category ${category}:`, error);
    }
  };


  // Add this function after your other loading functions
  const refreshDataSilently = async () => {
    try {
      // Create individual promises that won't reject
      const safeLoadRecentWorkouts = loadRecentWorkouts().catch(err => {
        console.error("Silent refresh error (recent workouts):", err);
        return null;
      });
      
      const safeLoadPopularWorkouts = loadPopularWorkouts().catch(err => {
        console.error("Silent refresh error (popular workouts):", err);
        return null;
      });
      
      const refreshPromises = [safeLoadRecentWorkouts, safeLoadPopularWorkouts];
      
      // Also refresh category data if we have a category selected
      if (selectedCategory) {
        const safeCategoryRefresh = getWorkoutsByCategory(selectedCategory).catch(err => {
          console.error(`Silent refresh error (category ${selectedCategory}):`, err);
          return null;
        });
        refreshPromises.push(safeCategoryRefresh);
      }
      
      // This will never throw since each promise is already catching its errors
      await Promise.all(refreshPromises);
    } catch (error) {
      // This is a fallback in case there's an unexpected error in the Promise.all itself
      console.error("Error refreshing data silently:", error);
    } finally {
      setIsBackgroundRefreshing(false);
    }
  };
  
  /**
   * Handles pull-to-refresh functionality
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };
  
  /**
   * Navigate to add new workout screen
   */
  const navigateToAddWorkout = () => {
    router.push('/add-new-workout');
  };

  
  // Replace the existing renderWorkoutList function
  const renderWorkoutList = useCallback((data, emptyMessage) => {
    if (data.length === 0 && !loading) {
      return <EmptyState message={emptyMessage} icon="fitness-outline" />;
    }
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workoutList}
      >
        {data.map((item, index) => {
          const itemKey = item.id || `workout-${index}`;
          return <WorkoutItem key={itemKey} workout={item} index={index} />;
        })}
      </ScrollView>
    );
  }, [loading]); // Add loading as dependency

  
  // Calculate header elevation based on scroll position
  const headerElevation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout App</Text>
        
        {/* Search input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search Workouts..."
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isSearching ? (
            // Search results UI
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              
              {searchResults.length > 0 ? (
                // Match the existing styles exactly
                <View style={styles.categoryContent}>
                  {searchResults.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={styles.workoutItem}
                      onPress={() => router.push({
                        pathname: '/workout-details',
                        params: {
                          id: workout.id,  // Use 'id' parameter name to match what workout-details expects
                          title: workout.title,
                          imageUrl: workout.imageUrl,
                          category: workout.category,
                          description: workout.description || "",
                          est_time: workout.est_time || "0",
                          exercises: JSON.stringify(workout.exercises || []),  // JSON stringify the exercises
                          user: JSON.stringify(workout.user || {})  // JSON stringify the user
                        }
                      })}
                    >
                  
                      <Image
                        source={{ uri: workout.imageUrl || 'https://via.placeholder.com/150' }}
                        style={styles.workoutImage}
                        resizeMode="cover"
                      />
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutTitle}>{workout.title}</Text>
                        <Text style={styles.workoutSubtitle}>{workout.category}</Text>
                        <Text style={styles.workoutMeta}>
                          {workout.exercises?.length || 0} exercises • {workout.est_time || '?'} min
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No workouts found matching "{searchTerm}"
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Try a different keyword or check spelling
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // Normal home page content - ensure we're using your exact component structure
            <>
              <Folder 
                category={(value) => {
                  setSelectedCategory(value);
                  
                  AsyncStorage.getItem(`cached_category_${value}`)
                    .then(cachedData => {
                      if (cachedData) {
                        try {
                          const parsed = JSON.parse(cachedData);
                          if (parsed && Array.isArray(parsed.data)) {
                            setWorkouts(prevWorkouts => mergeWorkouts(parsed.data, prevWorkouts));
                          }
                        } catch (parseError) {
                          console.error(`Error parsing cached data for category ${value}:`, parseError);
                        }
                      }
                      
                      setIsBackgroundRefreshing(true);
                      getWorkoutsByCategory(value);
                    })
                    .catch(error => {
                      console.error("Error getting cached category data:", error);
                      getWorkoutsByCategory(value);
                    });
                }}
                selectedCategory={selectedCategory}
              />
              
              {/* Recent Workouts Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Workouts</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recentWorkouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={styles.horizontalCard}
                      onPress={() => router.push({
                        pathname: '/workout-details',
                        params: {
                          id: workout.id,  // Use 'id' parameter name to match what workout-details expects
                          title: workout.title,
                          imageUrl: workout.imageUrl,
                          category: workout.category,
                          description: workout.description || "",
                          est_time: workout.est_time || "0",
                          exercises: JSON.stringify(workout.exercises || []),  // JSON stringify the exercises
                          user: JSON.stringify(workout.user || {})  // JSON stringify the user
                        }
                      })}
                    >
                      <Image
                        source={{ uri: workout.imageUrl || 'https://via.placeholder.com/150' }}
                        style={styles.horizontalCardImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.horizontalCardTitle} numberOfLines={1}>
                        {workout.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Popular Workouts Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Workouts</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {popularWorkouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={styles.horizontalCard}
                      onPress={() => router.push({
                        pathname: '/workout-details',
                        params: {
                          id: workout.id,  // Use 'id' parameter name to match what workout-details expects
                          title: workout.title,
                          imageUrl: workout.imageUrl,
                          category: workout.category,
                          description: workout.description || "",
                          est_time: workout.est_time || "0",
                          exercises: JSON.stringify(workout.exercises || []),  // JSON stringify the exercises
                          user: JSON.stringify(workout.user || {})  // JSON stringify the user
                        }
                      })}
                    >
                      <Image
                        source={{ uri: workout.imageUrl || 'https://via.placeholder.com/150' }}
                        style={styles.horizontalCardImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.horizontalCardTitle} numberOfLines={1}>
                        {workout.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Selected Category Workouts */}
              {selectedCategory && workouts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{selectedCategory}</Text>
                  <View style={styles.categoryContent}>
                    {workouts.map((workout) => (
                      <TouchableOpacity
                        key={workout.id}
                        style={styles.workoutItem}
                        onPress={() => router.push({
                          pathname: '/workout-details',
                          params: {
                            id: workout.id,  // Use 'id' parameter name to match what workout-details expects
                            title: workout.title,
                            imageUrl: workout.imageUrl,
                            category: workout.category,
                            description: workout.description || "",
                            est_time: workout.est_time || "0",
                            exercises: JSON.stringify(workout.exercises || []),  // JSON stringify the exercises
                            user: JSON.stringify(workout.user || {})  // JSON stringify the user
                          }
                        })}
                      >
                        <Image
                          source={{ uri: workout.imageUrl || 'https://via.placeholder.com/150' }}
                          style={styles.workoutImage}
                          resizeMode="cover"
                        />
                        <View style={styles.workoutDetails}>
                          <Text style={styles.workoutTitle}>{workout.title}</Text>
                          <Text style={styles.workoutSubtitle}>{workout.category}</Text>
                          <Text style={styles.workoutMeta}>
                            {workout.exercises?.length || 0} exercises • {workout.est_time || '?'} min
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  horizontalCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  horizontalCardTitle: {
    padding: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryContent: {
    marginTop: 10,
  },
  workoutItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  workoutImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  workoutDetails: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  workoutMeta: {
    fontSize: 12,
    color: '#999',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});