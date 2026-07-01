// app/add-new-workout/index.jsx
//
// Two-step workout creation:
//   Step 1 — name the workout and choose a cover image.
//   Step 2 — build the exercise list. Deliberately mirrors the workout-play
//            screen (shared WaveBackground + card language) so that creating a
//            workout and playing one feel like the same, coherent experience.

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useUser } from '@clerk/clerk-expo';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { db, storage } from '../../config/FirebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import WaveBackground from '../../components/WorkoutPlay/WaveBackground';
import AddExerciseModal from '../../components/WorkoutDetails/AddExerciseModal';
import { showToast, calculateWorkoutDuration } from '../../utils/helpers';

const MAX_SET_DOTS = 8; // cap the visual set-dots so many-set exercises stay tidy

// Read-only exercise card that mirrors the workout-play exercise card, so the
// create screen and the play screen share one visual language.
const ExercisePreviewCard = ({ exercise, onRemove, colors, isDark }) => (
  <MotiView
    from={{ opacity: 0, translateY: 12 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 300 }}
    style={[
      styles.exCard,
      { backgroundColor: colors.background, borderColor: colors.divider, ...Shadows[isDark ? 'dark' : 'light'].medium },
    ]}
  >
    <View style={styles.exCardBody}>
      <Text style={[styles.exTitle, { color: colors.text }]} numberOfLines={1}>{exercise.name}</Text>
      <View style={styles.exSubRow}>
        <Text style={[styles.exSubtitle, { color: colors.textTertiary }]}>
          {exercise.time ? `${exercise.time}s` : `${exercise.reps} reps`}
        </Text>
        <View style={styles.exDots}>
          {Array.from({ length: Math.min(exercise.sets || 0, MAX_SET_DOTS) }).map((_, i) => (
            <View key={i} style={[styles.exDot, { backgroundColor: colors.primary }]} />
          ))}
        </View>
        <Text style={[styles.exSetsText, { color: colors.textSecondary }]}>{exercise.sets} sets</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onRemove} hitSlop={8} style={styles.exRemove}>
      <Ionicons name="trash-outline" size={20} color={colors.error} />
    </TouchableOpacity>
  </MotiView>
);

export default function AddNewWorkout() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState();
  const [imageError, setImageError] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [loader, setLoader] = useState(false);

  useEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  // On step 2, Android hardware-back should return to step 1 rather than discard
  // the in-progress workout.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 2) { setStep(1); return true; }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const estTime = useMemo(() => calculateWorkoutDuration(exercises), [exercises]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) { setImage(result.assets[0].uri); setImageError(false); }
    } catch (error) {
      console.error('Image picker error:', error);
      showToast('Failed to select image');
    }
  };

  const goToStep2 = () => {
    const missingImage = !image;
    const missingTitle = !title.trim();
    setImageError(missingImage);
    if (missingTitle || missingImage) {
      if (missingTitle) showToast('Please name your workout');
      return; // a missing cover image is signalled by the red glow on the picker
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  const handleAddExercise = (newExercise) => {
    setExercises((prev) => [...prev, newExercise]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeExercise = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (exercises.length === 0) { showToast('Add at least one exercise'); return; }
    setLoader(true);
    try {
      const compressed = await manipulateAsync(image, [{ resize: { width: 1024 } }], { compress: 0.8, format: SaveFormat.JPEG });
      const resp = await fetch(compressed.uri);
      const blob = await resp.blob();
      const storageRef = ref(storage, '/Tidally/' + Date.now() + '.jpg');
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      const docId = Date.now().toString();
      await setDoc(doc(db, 'Routines', docId), {
        title: title.trim(),
        est_time: calculateWorkoutDuration(exercises),
        user: { email: user?.primaryEmailAddress?.emailAddress, imageUrl: user?.imageUrl, name: user?.fullName },
        imageUrl: downloadUrl,
        exercises,
        id: docId,
        createdAt: serverTimestamp(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Workout created successfully!');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Create workout error:', error);
      setLoader(false);
      showToast('Failed to create workout');
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground />

      {step === 1 ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.stepContent, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xxl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.divider }]} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.eyebrow, { color: colors.primary }]}>STEP 1 OF 2</Text>
            <Text style={[styles.heading, { color: colors.text }]}>Name your workout</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>Give it a title and a cover image. You'll add exercises next.</Text>

            <Pressable
              onPress={pickImage}
              style={[
                styles.cover,
                { borderColor: imageError ? colors.error : colors.divider, backgroundColor: colors.background },
                imageError && { borderWidth: 2, shadowColor: colors.error, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 8 },
              ]}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.coverImg} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="image-outline" size={40} color={imageError ? colors.error : colors.textTertiary} />
                  <Text style={[styles.coverText, { color: imageError ? colors.error : colors.textSecondary }]}>
                    {imageError ? 'Cover image required' : 'Tap to add a cover image'}
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.divider }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Workout name"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
                onSubmitEditing={goToStep2}
              />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={goToStep2} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>
          <ScrollView
            contentContainerStyle={[styles.stepContent, { paddingTop: insets.top + Spacing.md, paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.step2HeaderRow}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.divider, marginBottom: 0 }]} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              {image ? <Image source={{ uri: image }} style={styles.thumb} /> : null}
            </View>

            <Text style={[styles.eyebrow, { color: colors.primary }]}>STEP 2 OF 2</Text>
            <Text style={[styles.workoutTitle, { color: colors.text }]} numberOfLines={2}>{title.trim()}</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}{exercises.length > 0 ? ` • ~${estTime} min` : ''}
            </Text>

            <View style={styles.exList}>
              {exercises.map((ex, i) => (
                <ExercisePreviewCard key={ex.id || i} exercise={ex} onRemove={() => removeExercise(i)} colors={colors} isDark={isDark} />
              ))}
            </View>

            <TouchableOpacity style={[styles.addExCard, { borderColor: colors.primary }]} onPress={() => setIsAddModalVisible(true)} activeOpacity={0.7}>
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <Text style={[styles.addExText, { color: colors.primary }]}>Add exercise</Text>
            </TouchableOpacity>

            {exercises.length === 0 && (
              <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>Add your first exercise to get started.</Text>
            )}
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: exercises.length === 0 || loader ? 0.5 : 1 }]}
              onPress={handleCreate}
              disabled={exercises.length === 0 || loader}
              activeOpacity={0.85}
            >
              {loader ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>Create Workout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AddExerciseModal visible={isAddModalVisible} onClose={() => setIsAddModalVisible(false)} onAdd={handleAddExercise} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  stepContent: { paddingHorizontal: Spacing.lg },

  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginBottom: Spacing.lg },

  eyebrow: { ...Typography.caption1, fontFamily: 'outfit-medium', letterSpacing: 1, marginBottom: Spacing.xs },
  heading: { ...Typography.title1, letterSpacing: -0.5, marginBottom: Spacing.xs },
  workoutTitle: { ...Typography.largeTitle, fontFamily: 'outfit-bold', letterSpacing: -0.5, marginBottom: Spacing.xs },
  sub: { ...Typography.subhead, marginBottom: Spacing.xl },

  cover: { width: '100%', height: 200, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverText: { ...Typography.callout, marginTop: Spacing.sm },

  inputWrap: { borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  input: { height: 52, ...Typography.body },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, ...Shadows.medium },
  primaryBtnText: { ...Typography.headline, color: '#fff' },

  step2HeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  thumb: { width: 44, height: 44, borderRadius: BorderRadius.md },

  exList: { marginTop: Spacing.xs },
  exCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  exCardBody: { flex: 1 },
  exTitle: { fontSize: 20, fontFamily: 'outfit-bold', lineHeight: 26 },
  exSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: Spacing.sm, flexWrap: 'wrap' },
  exSubtitle: { fontSize: 14, fontFamily: 'outfit' },
  exDots: { flexDirection: 'row', gap: 4 },
  exDot: { width: 6, height: 6, borderRadius: 3 },
  exSetsText: { fontSize: 13, fontFamily: 'outfit-medium' },
  exRemove: { padding: Spacing.sm, marginLeft: Spacing.sm },

  addExCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: BorderRadius.md, paddingVertical: Spacing.md, marginTop: Spacing.xs },
  addExText: { ...Typography.headline },
  emptyHint: { ...Typography.subhead, textAlign: 'center', marginTop: Spacing.lg },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
});
