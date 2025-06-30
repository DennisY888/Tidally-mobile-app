// components/WorkoutDetails/ExerciseActionSheet.jsx
import React, { useMemo, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const ExerciseActionSheet = forwardRef(({ onEdit, onDelete }, ref) => {
  const { colors } = useTheme();
  const bottomSheetModalRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '35%'], []);
  const activeExerciseRef = useRef(null);

  useImperativeHandle(ref, () => ({
    present: (exercise, index) => {
      console.log("🔍 Action sheet present called with index:", index);
      activeExerciseRef.current = { exercise, index };
      bottomSheetModalRef.current?.present();
    },
  }));

  const handleEditPress = () => {
    bottomSheetModalRef.current?.dismiss();
    onEdit(activeExerciseRef.current.exercise, activeExerciseRef.current.index);
  };

  const handleDeletePress = () => {
    bottomSheetModalRef.current?.dismiss();
    onDelete(activeExerciseRef.current.exercise);
  };
  
  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      backgroundStyle={{ backgroundColor: colors.background }}
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Exercise Options</Text>
        <TouchableOpacity style={styles.optionButton} onPress={handleEditPress}>
          <Ionicons name="pencil-outline" size={24} color={colors.primary} />
          <Text style={[styles.optionText, { color: colors.primary }]}>Edit Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={[styles.optionText, { color: colors.error }]}>Delete Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => bottomSheetModalRef.current?.dismiss()}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
});

// Add Styles here as provided in the previous response...
const styles = StyleSheet.create({
  contentContainer: { flex: 1, paddingHorizontal: Spacing.lg },
  title: { ...Typography.title3, textAlign: 'center', marginBottom: Spacing.lg },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  optionText: { ...Typography.headline, marginLeft: Spacing.md },
  cancelButton: { padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.md, alignItems: 'center' },
  cancelText: { ...Typography.headline, fontFamily: 'outfit-medium' },
});


export default ExerciseActionSheet;