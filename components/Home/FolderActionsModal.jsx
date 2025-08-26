// components/Home/FolderActionsModal.jsx


import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
// BlurView is no longer needed
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Spacing, Shadows } from '../../constants/Colors';

const FolderActionsModal = ({
  visible,
  folder,
  onClose,
  onSaveName,
  onChangeImage,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(0));
  const [name, setName] = useState(folder?.name || '');

  useEffect(() => {
    if (visible) {
      setName(folder?.name || '');
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, folder]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Invalid Name", "Folder name cannot be empty.");
      return;
    }
    if (name.trim() !== folder?.name) {
      onSaveName(name.trim());
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    // ==================== ROOT FIX START ====================
    // Replicate the exact, proven structure from AddExerciseModal.jsx
    <View style={styles.modalContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* The unnecessary TouchableOpacity wrapper has been removed */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Edit Folder</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Folder Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.divider,
                  color: colors.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              autoFocus
              selectTextOnFocus
            />

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: '#fff' }]}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onChangeImage}
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
            >
              <Ionicons name="image-outline" size={16} color={colors.text} style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Change Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: colors.error }]}>Delete Folder</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
    // ===================== ROOT FIX END =====================
  );
};

const styles = StyleSheet.create({
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
    zIndex: 1000,
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    ...Typography.title3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  content: {
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  label: {
    ...Typography.footnote,
    fontFamily: 'outfit-medium',
    marginBottom: -Spacing.sm,
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 48,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  buttonText: {
    ...Typography.headline,
    fontFamily: 'outfit-medium',
  },
  saveButton: {
    // Custom styles if needed
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});

export default FolderActionsModal;