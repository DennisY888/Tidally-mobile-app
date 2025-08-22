import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Spacing, Shadows } from '../../constants/Colors';

export default function ReorderExercisesModal({ visible, exercises, onClose, onSave }) {
  const { colors, isDark } = useTheme();
  const [orderedExercises, setOrderedExercises] = useState([]);
  const styles = getStyles(colors, isDark);

  useEffect(() => {
    if (visible) {
      setOrderedExercises(JSON.parse(JSON.stringify(exercises)));
    }
  }, [visible, exercises]);
  
  const renderItem = useCallback(({ item, drag, isActive }) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          disabled={isActive}
          style={[
            styles.exerciseItem,
            { backgroundColor: colors.backgroundSecondary },
            isActive && { backgroundColor: colors.primaryLight, ...Shadows[isDark ? 'dark' : 'light'].large },
          ]}
        >
          <View style={styles.exerciseContent}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
              {item.reps ? `${item.reps} reps` : `${item.time}s`} • {item.sets} sets
            </Text>
          </View>
          <View style={styles.dragHandle}>
            <Ionicons name="menu" size={24} color={isActive ? colors.primary : colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, [colors, isDark, styles]);

  if (!visible) {
    return null;
  }

  const handleSave = () => {
    if (JSON.stringify(orderedExercises) === JSON.stringify(exercises)) {
      onClose();
      return;
    }
    onSave(orderedExercises);
  };


  const handleDragEnd = ({ data }) => {
    setOrderedExercises(data);
  };


  return (
    // ==================== ROOT FIX START ====================
    // Replicate the exact, proven structure from AddExerciseModal.jsx
    <View style={styles.modalContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Re-order Exercises</Text>
            <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
              <Text style={[styles.headerButtonText, { color: colors.primary, fontFamily: 'outfit-bold' }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsContainer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>Long-press and drag to re-order</Text>
          </View>

          {/* The list now lives inside the stable layout */}
          <DraggableFlatList
            data={orderedExercises}
            onDragEnd={handleDragEnd}
            keyExtractor={(item, index) => `${item.name}-${item.sets}-${item.reps}-${item.time}-${index}`}
            renderItem={renderItem}
            containerStyle={{ flex: 1, padding: Spacing.md }} // Use padding on the container
            contentContainerStyle={{ paddingBottom: Spacing.md }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
    // ===================== ROOT FIX END =====================
  );
}


const getStyles = (colors, isDark) => StyleSheet.create({
  // Replicate the exact, proven styles from AddExerciseModal.jsx
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  keyboardAvoid: {
    width: '90%',
    maxHeight: '75%',
  },
  modalContent: {
    width: '100%',
    height: '100%', // Allow content to fill the keyboardAvoid container
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows[isDark ? 'dark' : 'light'].large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.headline,
    fontFamily: 'outfit-medium',
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerButtonText: {
    ...Typography.body,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  instructionsText: {
    ...Typography.footnote,
    marginLeft: Spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    ...Shadows[isDark ? 'dark' : 'light'].small,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.headline,
    fontSize: 16,
  },
  exerciseDetails: {
    ...Typography.subhead,
    fontSize: 13,
    marginTop: 2,
  },
  dragHandle: {
    paddingLeft: Spacing.md,
  },
});