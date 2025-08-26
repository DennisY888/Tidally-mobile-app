// components/UI/ActionModal.jsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

/**
 * Custom Action Modal for Edit/Delete/Cancel operations
 * Replaces Alert.alert with a beautiful, themed modal
 */
const ActionModal = ({
  visible,
  title,
  message,
  itemName,
  onClose,
  onEdit,
  onDelete,
  onEditImage,
  showEditImage = false,
  showEdit = false,
  showDelete = false,
}) => {
  const { colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(itemName || '');
  const [scaleAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      setEditValue(itemName || '');
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
      setTimeout(() => setIsEditing(false), 200);
    }
  }, [visible]);

  const handleEdit = () => {
    if (isEditing) {
      // Save the edit
      if (editValue.trim() && onEdit) {
        onEdit(editValue.trim());
        onClose();
      }
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };


  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };


  const handleEditImage = () => {
    if (onEditImage) {
      onEditImage();
      onClose();
    }
  };


  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(itemName || '');
    onClose();
  };


  if (!visible) return null;


  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <BlurView
        intensity={20}
        tint={isDark ? 'dark' : 'light'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {message && (
                  <Text style={[styles.message, { color: colors.textSecondary }]}>
                    {message}
                  </Text>
                )}

                {isEditing ? (
                  <View style={styles.editContainer}>
                    <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                      New Name:
                    </Text>
                    <TextInput
                      style={[
                        styles.editInput,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.divider,
                          color: colors.text,
                        },
                      ]}
                      value={editValue}
                      onChangeText={setEditValue}
                      placeholder="Enter name..."
                      placeholderTextColor={colors.textTertiary}
                      autoFocus
                      selectTextOnFocus
                    />
                  </View>
                ) : (
                  <View style={[styles.nameContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      "{itemName}"
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[
                    styles.actionButton,
                    styles.cancelButton,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                {showEditImage && !isEditing && (
                  <TouchableOpacity
                    onPress={handleEditImage}
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Ionicons name="image" size={16} color={colors.text} style={styles.buttonIcon} />
                    <Text style={[styles.buttonText, { color: colors.text }]}>
                      Image
                    </Text>
                  </TouchableOpacity>
                )}

                {showEdit && (
                  <TouchableOpacity
                    onPress={handleEdit}
                    style={[
                      styles.actionButton,
                      styles.editButton,
                      { backgroundColor: colors.primary },
                    ]}
                    disabled={isEditing && !editValue.trim()}
                  >
                    <Ionicons 
                      name={isEditing ? "checkmark" : "pencil"} 
                      size={16} 
                      color="#fff" 
                      style={styles.buttonIcon}
                    />
                    <Text style={[styles.buttonText, { color: '#fff' }]}>
                      {isEditing ? 'Save' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                )}

                {showDelete && !isEditing && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[
                      styles.actionButton,
                      styles.deleteButton,
                      { backgroundColor: colors.error },
                    ]}
                  >
                    <Ionicons name="trash" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={[styles.buttonText, { color: '#fff' }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: Math.min(width - 40, 340),
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
  },
  title: {
    ...Typography.title3,
    flex: 1,
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  nameContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  itemName: {
    ...Typography.headline,
    textAlign: 'center',
  },
  editContainer: {
    marginBottom: Spacing.sm,
  },
  editLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.xs,
    fontFamily: 'outfit-medium',
  },
  editInput: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 48,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
  buttonText: {
    ...Typography.headline,
    fontFamily: 'outfit-medium',
  },
  cancelButton: {
    flex: 0.8,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});

export default ActionModal;