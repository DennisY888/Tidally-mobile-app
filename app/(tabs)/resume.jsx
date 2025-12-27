import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import WorkoutSessionService from '../../services/WorkoutSessionService';
import { WorkoutService } from '../../services/WorkoutService';
import { useActiveWorkout } from '../../context/WorkoutDetailContext';

export default function Resume() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { setPlaybackWorkout } = useActiveWorkout();
  
  const [savedSessions, setSavedSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setRefreshing(true);
      const sessions = await WorkoutSessionService.getSavedSessions();
      const validatedSessions = await Promise.all(
        (sessions || []).map(async (session) => {
          if (!session || !session.workoutId) return null;
          try {
            const workoutFromDb = await WorkoutService.getWorkoutById(session.workoutId);
            if (!workoutFromDb) return { ...session, isOrphaned: true };
            return {
              ...session,
              workoutTitle: workoutFromDb.title,
              workoutImageUrl: workoutFromDb.imageUrl,
              category: workoutFromDb.category,
              description: workoutFromDb.description,
              est_time: workoutFromDb.est_time,
              exercises: session.exercises || [], 
              isOrphaned: false,
            };
          } catch (error) { return { ...session, isOrphaned: true }; }
        })
      );
      setSavedSessions(validatedSessions.filter(Boolean).sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)));
    } catch (error) { setSavedSessions([]); } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadSessions);
    return unsubscribe;
  }, [navigation, loadSessions]);
  
  const handleResumeWorkout = (session) => {
    try {
      setPlaybackWorkout({
        id: session.workoutId,
        title: session.workoutTitle,
        imageUrl: session.workoutImageUrl,
        category: session.category,
        description: session.description,
        est_time: session.est_time,
        exercises: session.exercises, 
        elapsedTime: session.elapsedTime,
        progress: session.progress,
        isResuming: true
      });

      router.push({
        pathname: '/workout-play',
        params: { isResuming: 'true' }
      });
    } catch (error) {
      Alert.alert("Error", "Could not resume the workout session.");
    }
  };

  const handleCleanupOrphanedSession = async (session) => {
    await WorkoutSessionService.deleteSession(session.workoutId);
    loadSessions();
  };
  
  const handleOrphanedSession = (session) => {
    Alert.alert("Workout No Longer Available", `"${session.workoutTitle}" has been deleted.`, [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => handleCleanupOrphanedSession(session) }
    ]);
  };
  
  const renderSessionItem = ({ item }) => {
    const progress = Math.round((item.progress || 0) * 100);
    const progressColor = progress < 30 ? colors.error : progress < 70 ? colors.warning : colors.success;
    
    return (
      <TouchableOpacity style={[styles.sessionCard, { backgroundColor: colors.background }]} onPress={() => item.isOrphaned ? handleOrphanedSession(item) : handleResumeWorkout(item)}>
        <View style={styles.sessionHeader}>
          <Image source={{ uri: item.workoutImageUrl }} style={[styles.workoutImage, item.isOrphaned && styles.orphanedImage]} />
          <View style={styles.sessionInfo}>
            <View style={styles.titleContainer}>
              <Text style={[styles.workoutTitle, { color: item.isOrphaned ? colors.textTertiary : colors.text }]} numberOfLines={2}>{item.workoutTitle}</Text>
              {item.isOrphaned && <View style={[styles.orphanedBadge, { backgroundColor: colors.error }]}><Ionicons name="warning" size={12} color="#fff" /><Text style={styles.orphanedBadgeText}>Deleted</Text></View>}
            </View>
            <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>Last played {new Date(item.lastAccessedAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.timeInfo}><Ionicons name="time-outline" size={16} color={colors.primary} /><Text style={[styles.timeText, { color: colors.textSecondary }]}>{Math.floor(item.elapsedTime / 60)}:{(item.elapsedTime % 60).toString().padStart(2, '0')}</Text></View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: item.isOrphaned ? colors.textTertiary : progressColor }]} /></View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progress}% Complete</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.title, { color: colors.text }]}>Resume Workouts</Text>
      {savedSessions.length > 0 ? (
        <FlatList data={savedSessions} renderItem={renderSessionItem} keyExtractor={(item) => item.workoutId} contentContainerStyle={styles.sessionList} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSessions} colors={[colors.primary]} tintColor={colors.primary} />} />
      ) : (
        <View style={styles.emptyContainer}><Ionicons name="fitness-outline" size={64} color={colors.textTertiary} /><Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts to resume</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg },
  title: { marginTop: Spacing.lg, ...Typography.title1, marginBottom: Spacing.lg },
  sessionList: { paddingBottom: 20 },
  sessionCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.medium },
  sessionHeader: { flexDirection: 'row', marginBottom: Spacing.md },
  workoutImage: { width: 70, height: 70, borderRadius: BorderRadius.md, marginRight: Spacing.md, backgroundColor: '#e0e0e0' },
  orphanedImage: { opacity: 0.4 },
  sessionInfo: { flex: 1, justifyContent: 'center' },
  workoutTitle: { ...Typography.headline, marginBottom: 4 },
  sessionDate: { ...Typography.caption1 },
  progressSection: { marginTop: Spacing.xs },
  timeInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  timeText: { ...Typography.footnote, marginLeft: 4 },
  progressContainer: { marginTop: Spacing.xs },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { ...Typography.caption2, textAlign: 'right' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyText: { ...Typography.title3, marginTop: Spacing.md, marginBottom: Spacing.xs },
  titleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orphanedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm, marginLeft: 8 },
  orphanedBadgeText: { ...Typography.caption2, color: '#fff', marginLeft: 2, fontFamily: 'outfit-medium' },
});