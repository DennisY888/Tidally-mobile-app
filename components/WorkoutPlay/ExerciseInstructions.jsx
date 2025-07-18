import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

const INSTRUCTIONS_STORAGE_KEY = '@tidally_instructions_hidden';

/**
 * Instructions card for workout exercises with dismissible functionality
 *
 * @returns {React.ReactNode}
 */
const ExerciseInstructions = () => {
  const { colors } = useTheme();
  const [isHidden, setIsHidden] = useState(false);

  // Load hidden preference on component mount
  useEffect(() => {
    const loadHiddenPreference = async () => {
      try {
        const hidden = await AsyncStorage.getItem(INSTRUCTIONS_STORAGE_KEY);
        if (hidden === 'true') {
          setIsHidden(true);
        }
      } catch (error) {
        console.error('Failed to load instructions preference:', error);
      }
    };
    loadHiddenPreference();
  }, []);

  // Save hidden preference and hide component
  const handleClose = async () => {
    try {
      await AsyncStorage.setItem(INSTRUCTIONS_STORAGE_KEY, 'true');
      setIsHidden(true);
    } catch (error) {
      console.error('Failed to save instructions preference:', error);
    }
  };

  // Don't render anything if hidden
  if (isHidden) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        ...Shadows.small
      }
    ]}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={handleClose}
      >
        <Ionicons name="close" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <View style={styles.instructionItem}>
        <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          Swipe exercise left or right to complete a set
        </Text>
      </View>
      <View style={styles.instructionItem}>
        <Ionicons name="play-circle" size={20} color={colors.primary} />
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          Tap play on timed exercises to start timer
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingRight: 40, 
  },
  instructionText: {
    ...Typography.footnote,
    marginLeft: 8,
  },
});

export default ExerciseInstructions;