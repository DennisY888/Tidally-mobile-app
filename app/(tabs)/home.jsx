import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { debounce } from 'lodash';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import Folder from '../../components/Home/Folder';
import { WorkoutService } from '../../services/WorkoutService';
import HighlightedText from '../../components/UI/HighlightedText';
import { useWorkouts } from '../../hooks/useWorkouts';
import Workout from '../../components/Home/Workout'; 
import { useActiveWorkout } from '../../context/WorkoutDetailContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '../../context/UserProfileContext';
import { getSVGComponent, adaptColorForDarkMode } from '../../constants/ProfileIcons';
import { LinearGradient } from 'expo-linear-gradient';

const getGreeting = () => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) return "Good morning,";
  if (currentHour < 18) return "Good afternoon,";
  return "Good evening,";
};

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark, insets);
  
  const { workouts, loading } = useWorkouts(selectedCategory);

  const { setActiveWorkout } = useActiveWorkout();
  const { userProfile } = useUserProfile();
  const userName = user?.fullName || user?.firstName || 'User';
  const greeting = getGreeting();

  const getMatchContext = (workout, term) => {
    const lowercasedTerm = term.toLowerCase().trim();
    if (!lowercasedTerm) return null;
    if (workout.title?.toLowerCase().includes(lowercasedTerm)) return null;
    const matchingExercise = workout.exercises?.find(ex => ex.name?.toLowerCase().includes(lowercasedTerm));
    return matchingExercise ? matchingExercise.name : null;
  };

  const debouncedSearch = useCallback(
    debounce(async (term) => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      if (!user?.primaryEmailAddress?.emailAddress) return;
      
      setIsSearching(true);
      setIsSearchLoading(true);
      try {
        const { workouts } = await WorkoutService.searchWorkouts(trimmedTerm, user.primaryEmailAddress.emailAddress);
        setSearchResults(workouts);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300),
    [user?.primaryEmailAddress?.emailAddress]
  );

  const handleSearch = useCallback((text) => {
    setSearchTerm(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  useEffect(() => { return () => debouncedSearch.cancel(); }, [debouncedSearch]);

  const navigateToAddWorkout = () => { router.push('/add-new-workout'); };

  const renderSearchResultItem = ({ item: workout }) => {
    const matchContext = getMatchContext(workout, searchTerm);
    const navigateToDetails = () => {
      setActiveWorkout(workout); 
      router.push('/workout-details/' + (workout.id || workout._id));
    };

    return (
      <TouchableOpacity style={styles.workoutItem} onPress={navigateToDetails}>
        <Image source={{ uri: workout.imageUrl || 'https://via.placeholder.com/150' }} style={styles.workoutImage} resizeMode="cover" />
        <View style={styles.workoutDetails}>
          <HighlightedText text={workout.title} highlight={searchTerm} style={styles.workoutTitle} />
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
          <Text style={styles.workoutMeta}>{workout.exercises?.length || 0} exercises • {workout.est_time || '?'} min</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.headerTitle}>{userName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/stopwatch')} activeOpacity={0.7}>
            <Ionicons name="stopwatch-outline" size={28} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')} activeOpacity={0.7}>
            {userProfile?.customProfile?.useCustom ? (
              <MotiView animate={{ scale: [1, 1.08, 1], rotate: ['0deg', '2deg', '-2deg', '0deg'] }} transition={{ type: 'timing', duration: 3000, repeat: Infinity }}>
                <View style={[styles.profileImageCustom, styles.premiumProfileButton, styles.grandProfileButton, { borderColor: colors.primary + '50', shadowColor: colors.primary, ...Shadows[isDark ? 'dark' : 'light'].large }]}>
                  {userProfile.customProfile.backgroundType === 'gradient' && userProfile.customProfile.gradientColors ? (
                    <LinearGradient colors={isDark ? userProfile.customProfile.gradientColors.map(color => adaptColorForDarkMode(color)) : userProfile.customProfile.gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? adaptColorForDarkMode(userProfile.customProfile.backgroundColor) : userProfile.customProfile.backgroundColor }]} />
                  )}
                  {(() => {
                    const SVGComponent = getSVGComponent(userProfile.customProfile.animalType, userProfile.customProfile.animalColor);
                    return SVGComponent ? <SVGComponent width={45} height={45} /> : null;
                  })()}
                </View>
              </MotiView>
            ) : user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
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

      <FlatList
        data={isSearching ? searchResults : workouts}
        renderItem={({ item }) => isSearching ? renderSearchResultItem({ item }) : <Workout workout={item} layout='row' />}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          isSearching ? (
            <View style={styles.section}><Text style={styles.sectionTitle}>Search Results</Text></View>
          ) : (
            <>
              <Folder
                category={(value) => setSelectedCategory(value)}
                selectedCategory={selectedCategory}
                user={user}
              />
              {workouts.length > 0 && (
                <View style={styles.section}><Text style={styles.sectionTitle}>{selectedCategory || 'Your Workouts'}</Text></View>
              )}
            </>
          )
        }
        ListEmptyComponent={
          (isSearching && isSearchLoading) || (!isSearching && loading) ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{isSearching ? `No workouts found for "${searchTerm}"` : 'No workouts found'}</Text>
              <Text style={styles.emptySubtext}>{isSearching ? 'Try a different keyword.' : 'Create your first workout to see it here!'}</Text>
            </View>
          )
        }
      />

      <View style={[styles.bottomBar, { borderTopColor: colors.divider }]}>
        <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={navigateToAddWorkout} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create a Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDark, insets) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { backgroundColor: colors.background, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greetingText: { ...Typography.body, color: colors.textSecondary, marginBottom: -4 },
  headerTitle: { ...Typography.title1, color: colors.text, fontFamily: 'outfit-bold', letterSpacing: -0.5 },
  profileButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  searchInput: { height: 52, borderWidth: 0, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.xl, backgroundColor: colors.backgroundSecondary, color: colors.text, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  section: { paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.title2, color: colors.text, marginBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  workoutItem: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, ...Shadows.small, elevation: isDark ? 1 : 3 },
  workoutImage: { width: 100, height: '100%', backgroundColor: colors.backgroundSecondary, borderTopLeftRadius: BorderRadius.lg, borderBottomLeftRadius: BorderRadius.lg },
  workoutDetails: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  workoutTitle: { ...Typography.headline, color: colors.text, marginBottom: 4 },
  workoutSubtitle: { ...Typography.subhead, color: colors.textSecondary, marginBottom: 8 },
  workoutMeta: { ...Typography.caption1, color: colors.textTertiary },
  matchContextContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 5, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: colors.success + '1A', borderRadius: BorderRadius.sm, alignSelf: 'flex-start' },
  matchContextText: { ...Typography.caption1, color: colors.textSecondary, marginLeft: 4, flexShrink: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, marginTop: Spacing.xl },
  emptyText: { ...Typography.headline, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtext: { ...Typography.body, color: colors.textTertiary, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, padding: Spacing.md, paddingBottom: Math.max(insets.bottom, Spacing.md), borderTopWidth: 1 },
  createButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadows.medium },
  createButtonText: { ...Typography.headline, color: '#fff', marginLeft: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.divider },
  profileImageCustom: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
  premiumProfileButton: { borderWidth: 1, borderColor: colors.primary, ...Shadows.small },
  grandProfileButton: { borderWidth: 2, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
});