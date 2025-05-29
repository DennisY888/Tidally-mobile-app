// components/WorkoutDetails/CreatorProfile.jsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

/**
 * Creator profile component for workout details
 * 
 * @param {Object} props - Component props
 * @param {Object} props.workoutCreator - Creator data
 * @param {Function} props.onMessagePress - Function to handle messaging
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {Object} props.colors - Theme colors
 * @returns {React.ReactNode}
 */
const CreatorProfile = ({ workoutCreator, onMessagePress, isDark, colors }) => {
  return (
    <>
      <View style={[
        styles.creatorCard, 
        { backgroundColor: isDark ? colors.backgroundSecondary : colors.backgroundSecondary }
      ]}>
        <Image 
          source={{ uri: workoutCreator?.imageUrl }}
          style={styles.creatorImage}
        />
        
        <View style={styles.creatorInfo}>
          <Text style={[styles.creatorName, { color: isDark ? colors.text : colors.text }]}>
            {workoutCreator?.name}
          </Text>
          <Text style={[styles.creatorEmail, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
            {workoutCreator?.email}
          </Text>
          
          <TouchableOpacity 
            style={[styles.messageButton, { backgroundColor: isDark ? colors.primary : colors.primary }]}
            onPress={onMessagePress}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.creatorSection}>
        <Text style={[styles.creatorSectionTitle, { color: isDark ? colors.text : colors.text }]}>
          About Creator
        </Text>
        <Text style={[styles.creatorDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
          This trainer specializes in creating effective workouts for all fitness levels.
          Follow their workouts for consistent results.
        </Text>
      </View>
      
      <View style={styles.creatorSection}>
        <Text style={[styles.creatorSectionTitle, { color: isDark ? colors.text : colors.text }]}>
          More from this Creator
        </Text>
        <TouchableOpacity style={styles.viewMoreButton}>
          <Text style={[styles.viewMoreText, { color: isDark ? colors.primary : colors.primary }]}>
            View all workouts
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={16} 
            color={isDark ? colors.primary : colors.primary} 
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  creatorCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  creatorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: Spacing.lg,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    ...Typography.headline,
  },
  creatorEmail: {
    ...Typography.footnote,
    marginBottom: Spacing.md,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  messageButtonText: {
    ...Typography.footnote,
    color: '#fff',
    marginLeft: 4,
    fontFamily: 'outfit-medium',
  },
  creatorSection: {
    marginBottom: Spacing.lg,
  },
  creatorSectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.sm,
  },
  creatorDescription: {
    ...Typography.body,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  viewMoreText: {
    ...Typography.subhead,
    marginRight: Spacing.xs,
  },
});

export default CreatorProfile;