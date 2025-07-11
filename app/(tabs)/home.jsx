// app/(tabs)/home.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Image
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { debounce } from 'lodash';

import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import Folder from '../../components/Home/Folder';
import { WorkoutService } from '../../services/WorkoutService';
import HighlightedText from '../../components/UI/HighlightedText';
import { useWorkouts } from '../../hooks/useWorkouts';
import Workout from '../../components/Home/Workout'; 
import { useActiveWorkout } from '../../context/WorkoutDetailContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';


/**
 * Home Screen
 *
 * Main navigation hub for the app displaying various workout collections
 * and a primary action to create new workouts.
 */
export default function Home() {
  // State management
  const [selectedCategory, setSelectedCategory] = useState('');

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Hooks
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark, insets); // Create theme-aware styles
  const navigation = useNavigation();
  const { workouts, loading } = useWorkouts(selectedCategory);

  const { setActiveWorkout } = useActiveWorkout();


  // Helper function to determine search match context
  const getMatchContext = (workout, term) => {
    const lowercasedTerm = term.toLowerCase().trim();
    if (!lowercasedTerm) return null;
    if (workout.title?.toLowerCase().includes(lowercasedTerm)) return null;
    const matchingExercise = workout.exercises?.find(ex =>
      ex.name?.toLowerCase().includes(lowercasedTerm)
    );
    return matchingExercise ? matchingExercise.name : null;
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      setIsSearchLoading(true);
      try {
        const { workouts } = await WorkoutService.searchWorkouts(trimmedTerm, user.primaryEmailAddress.emailAddress);
        setSearchResults(workouts);
      } catch (error) {
        console.error("Error in search:", error);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300),
    []
  );

  // Handler for search input
  const handleSearch = useCallback((text) => {
    setSearchTerm(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);


  const navigateToAddWorkout = () => {
    router.push('/add-new-workout');
  };

  
  const renderSearchResultItem = ({ item: workout }) => {
    const matchContext = getMatchContext(workout, searchTerm);

    const navigateToDetails = () => {
      setActiveWorkout(workout); 
      router.push('/workout-details/' + workout.id);
    };

    return (
      <TouchableOpacity
        style={styles.workoutItem}
        onPress={navigateToDetails}
      >
        <Image
          source={{ uri: workout.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.workoutImage}
          resizeMode="cover"
        />
        <View style={styles.workoutDetails}>
          <HighlightedText
            text={workout.title}
            highlight={searchTerm}
            style={styles.workoutTitle}
          />
          {matchContext ? (
            <View style={styles.matchContextContainer}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={styles.matchContextText} numberOfLines={1}>
                Matches: <HighlightedText text={matchContext} highlight={searchTerm} style={{ fontFamily: 'outfit-medium' }}/>
              </Text>
            </View>
          ) : (
            <Text style={styles.workoutSubtitle} numberOfLines={1}>{workout.category}</Text>
          )}
          <Text style={styles.workoutMeta}>
            {workout.exercises?.length || 0} exercises • {workout.est_time || '?'} min
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Tidally</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/stopwatch')}
            activeOpacity={0.7}
          >
            <Ionicons name="stopwatch-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search workouts or exercises..."
          placeholderTextColor={colors.textTertiary}
          value={searchTerm}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Main Content Area */}
      <FlatList
        data={isSearching ? searchResults : workouts}
        renderItem={({ item }) => {
          if (isSearching) {
            return renderSearchResultItem({ item });
          } else {
            return <Workout workout={item} layout='row' />;
          }
        }}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          isSearching ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
            </View>
          ) : (
            <>
              <Folder
                category={(value) => {
                  setSelectedCategory(value);
                }}
                selectedCategory={selectedCategory}
                user={user}
              />
              {workouts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{selectedCategory || 'Your Workouts'}</Text>
                </View>
              )}
            </>
          )
        }
        ListEmptyComponent={
          (isSearching && isSearchLoading) || (!isSearching && loading) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isSearching ? `No workouts found for "${searchTerm}"` : 'No workouts found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isSearching ? 'Try a different keyword or check spelling.' : 'Create your first workout to see it here!'}
              </Text>
            </View>
          )
        }
      />

      {/* Floating Action Button - Now sits outside the list, but layered correctly by SafeAreaView */}
      <View style={[styles.bottomBar, { borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={navigateToAddWorkout}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create a Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


// Theme-aware Style Factory
const getStyles = (colors, isDark, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.title1,
    color: colors.text,
    fontFamily: 'outfit-bold', 
  letterSpacing: -0.5,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchInput: {
    height: 52, 
    borderWidth: 0, 
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: colors.backgroundSecondary,
    shadowColor: colors.shadow, 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.title2,
    color: colors.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  workoutItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
    elevation: isDark ? 1 : 3,
  },
  workoutImage: {
    width: 100,
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  workoutDetails: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  workoutTitle: {
    ...Typography.headline,
    color: colors.text,
    marginBottom: 4,
  },
  workoutSubtitle: {
    ...Typography.subhead,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  workoutMeta: {
    ...Typography.caption1,
    color: colors.textTertiary,
  },

  matchContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.success + '1A',
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  matchContextText: {
    ...Typography.caption1,
    color: colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyText: {
    ...Typography.headline,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: Spacing.md,
    paddingBottom: Math.max(insets.bottom, Spacing.md),
    borderTopWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  createButtonText: {
    ...Typography.headline,
    color: '#fff',
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
});