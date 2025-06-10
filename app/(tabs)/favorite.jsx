// app/(tabs)/favorite.jsx

import { View, Text, FlatList, StyleSheet, Platform } from 'react-native'
import React from 'react'
import { useUser } from '@clerk/clerk-expo'
import Workout from './../../components/Home/Workout'
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing} from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Favorite() {
  const { user } = useUser();
  const { favWorkouts, loader } = useFavorites();
  const { colors } = useTheme();
  
  // Render empty state when no favorites
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorites Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Workouts you favorite will appear here for quick access
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
      <FlatList
        data={favWorkouts}
        numColumns={2}
        refreshing={loader}
        contentContainerStyle={favWorkouts.length === 0 && styles.centerContent}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <View style={styles.workoutContainer}>
            <Workout workout={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    ...Typography.title1,
    marginBottom: Spacing.lg,
  },
  workoutContainer: {
    margin: Spacing.xs,
    width: '48%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.title3,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  }
});