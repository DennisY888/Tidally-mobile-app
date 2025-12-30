// components/WorkoutPlay/NewRepCounter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Play, Pause } from 'lucide-react-native';

const NewRepCounter = ({ 
  reps, 
  onComplete, 
  currentSet, 
  totalSets, 
  savedReps, 
  onUpdate   
}) => {
  const { colors } = useTheme();
  
  const [completed, setCompleted] = useState(savedReps !== undefined ? savedReps : 0);
  const [autoRunning, setAutoRunning] = useState(false);
  const completionHandled = useRef(false);
  const isComplete = completed >= reps;
  
  const completedRef = useRef(completed);
  useEffect(() => { completedRef.current = completed; }, [completed]);

  useEffect(() => {
    return () => {
      if (onUpdate) onUpdate(completedRef.current);
    };
  }, []);

  useEffect(() => {
    setCompleted(savedReps !== undefined ? savedReps : 0);
    setAutoRunning(false);
    completionHandled.current = false;
  }, [reps, currentSet]); 

  useEffect(() => {
    let timer;
    if (autoRunning && completed < reps) {
      timer = setTimeout(() => {
        setCompleted(prev => prev + 1);
      }, 2000); 
    }
    return () => clearTimeout(timer);
  }, [autoRunning, completed, reps]);

  useEffect(() => {
    if (isComplete && !completionHandled.current) {
      completionHandled.current = true;
      setAutoRunning(false);
      const timer = setTimeout(() => { onComplete(); }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const incrementRep = () => { if (!isComplete) setCompleted(prev => prev + 1); };
  
  const decrementRep = () => { 
    if (!isComplete && completed > 0) {
        setCompleted(prev => prev - 1); 
    }
  };

  const toggleAutoMode = () => { if (!isComplete) setAutoRunning(prev => !prev); };
  
  const progress = reps > 0 ? (completed / reps) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.divider }]}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.primary + '20' }]} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>SET {currentSet}/{totalSets}</Text>
              </View>
              <View style={styles.countRow}>
                <Text style={[styles.currentCount, { color: colors.text }]}>{completed}</Text>
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>/</Text>
                <Text style={[styles.totalCount, { color: colors.textSecondary }]}>{reps}</Text>
              </View>
            </View>
            
            <View style={styles.controlsColumn}>
              <TouchableOpacity 
                onPress={toggleAutoMode} 
                disabled={isComplete} 
                style={[styles.playButton, { backgroundColor: autoRunning ? colors.error + '20' : colors.primary }]}
              >
                {autoRunning ? <Pause size={28} color={colors.error} /> : <Play size={28} color="#FFF" />}
              </TouchableOpacity>
              
              {!autoRunning && !isComplete && (
                  <View style={styles.manualControlsRow}>
                      <TouchableOpacity 
                        onPress={decrementRep} 
                        style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.divider }]}
                      >
                         <Text style={{color: colors.text, fontSize: 20, fontFamily: 'outfit-bold'}}>-</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={incrementRep} 
                        style={[styles.controlButton, { backgroundColor: colors.primaryLight }]}
                      >
                         <Text style={{color: colors.primary, fontSize: 20, fontFamily: 'outfit-bold'}}>+</Text>
                      </TouchableOpacity>
                  </View>
              )}
            </View>
          </View>
          
          <View style={[styles.bottomProgressTrack, { backgroundColor: colors.primaryLight }]}>
            <View style={[styles.bottomProgressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    card: {
        position: 'relative', overflow: 'hidden', borderRadius: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
        borderWidth: 1,
    },
    progressBar: { position: 'absolute', top: 0, bottom: 0, left: 0 },
    content: { paddingHorizontal: 24, paddingVertical: 32 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
    badgeText: { fontSize: 12, fontFamily: 'outfit-medium' },
    countRow: { flexDirection: 'row', alignItems: 'baseline' },
    currentCount: { fontSize: 72, fontFamily: 'outfit-bold' },
    dividerText: { fontSize: 30, marginHorizontal: 4, fontFamily: 'outfit' },
    totalCount: { fontSize: 36, fontFamily: 'outfit-medium' },
    controlsColumn: { flexDirection: 'column', alignItems: 'center', gap: 8 },
    playButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.2, elevation: 4 },
    manualControlsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    controlButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    bottomProgressTrack: { width: '100%', height: 12, borderRadius: 9999, overflow: 'hidden' },
    bottomProgressFill: { height: '100%' },
});

export default NewRepCounter;