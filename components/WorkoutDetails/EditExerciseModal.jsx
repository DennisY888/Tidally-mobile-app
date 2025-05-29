// components/WorkoutDetails/EditExerciseModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function EditExerciseModal({ visible, onClose, exercise, onSave }) {
  // Don't render when not visible
  if (!visible || !exercise) return null;

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseType, setExerciseType] = useState('reps'); // 'reps' or 'time'
  const [reps, setReps] = useState('');
  const [time, setTime] = useState('');
  const [sets, setSets] = useState('');

  // Initialize form with exercise data when visible or exercise changes
  useEffect(() => {
    if (visible && exercise) {
      setExerciseName(exercise.name || '');
      setSets(exercise.sets ? exercise.sets.toString() : '');
      
      if (exercise.reps) {
        setExerciseType('reps');
        setReps(exercise.reps.toString());
        setTime('');
      } else if (exercise.time) {
        setExerciseType('time');
        setTime(exercise.time.toString());
        setReps('');
      }
    }
  }, [visible, exercise]);

  const handleSave = () => {
    // Validate inputs
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
  
    if (exerciseType === 'reps' && !reps.trim()) {
      Alert.alert('Error', 'Please enter number of reps');
      return;
    }
  
    if (exerciseType === 'time' && !time.trim()) {
      Alert.alert('Error', 'Please enter time in seconds');
      return;
    }
  
    if (!sets.trim()) {
      Alert.alert('Error', 'Please enter number of sets');
      return;
    }
  
    // Create updated exercise object
    const updatedExercise = {
      // Keep any existing properties from the original exercise
      ...exercise,
      // Update with new values
      name: exerciseName,
      sets: parseInt(sets),
      reps: exerciseType === 'reps' ? parseInt(reps) : null,
      time: exerciseType === 'time' ? parseInt(time) : null
    };
    
    // Pass to parent component
    onSave(updatedExercise);
  };

  return (
    <View style={styles.modalContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Exercise</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <TextInput
            style={styles.input}
            placeholder="Exercise Name"
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholderTextColor={Colors.light.textTertiary}
          />

          {/* Exercise Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                exerciseType === 'reps' && styles.toggleActive
              ]}
              onPress={() => setExerciseType('reps')}
            >
              <Text
                style={[
                  styles.toggleText,
                  exerciseType === 'reps' && styles.toggleTextActive
                ]}
              >
                Reps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                exerciseType === 'time' && styles.toggleActive
              ]}
              onPress={() => setExerciseType('time')}
            >
              <Text
                style={[
                  styles.toggleText,
                  exerciseType === 'time' && styles.toggleTextActive
                ]}
              >
                Time
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reps or Time Input */}
          {exerciseType === 'reps' ? (
            <TextInput
              style={styles.input}
              placeholder="Number of Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholderTextColor={Colors.light.textTertiary}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Time in Seconds"
              value={time}
              onChangeText={setTime}
              keyboardType="number-pad"
              placeholderTextColor={Colors.light.textTertiary}
            />
          )}

          {/* Sets Input */}
          <TextInput
            style={styles.input}
            placeholder="Number of Sets"
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
            placeholderTextColor={Colors.light.textTertiary}
          />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'outfit-medium',
  },
  closeButton: {
    padding: 5,
  },
  input: {
    backgroundColor: Colors.light.lightGray,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontFamily: 'outfit',
    color: Colors.light.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
  },
  toggleActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'outfit',
    color: Colors.light.text,
  },
  toggleTextActive: {
    color: '#fff',
    fontFamily: 'outfit-medium',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.divider,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontFamily: 'outfit-medium',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-medium',
  },
});