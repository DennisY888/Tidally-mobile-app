// components/UI/Card.jsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../constants/Colors';

export function Card({ 
  children, 
  onPress, 
  elevation = 'medium', // 'small', 'medium', 'large', 'none'
  style, 
  ...props 
}) {
  const getElevation = () => {
    if (elevation === 'none') return {};
    
    switch (elevation) {
      case 'small': return Shadows.small;
      case 'large': return Shadows.large;
      default: return Shadows.medium;
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
      style={[
        styles.card,
        getElevation(),
        style,
      ]}
      {...props}
    >
      {children}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    padding: 16,
    overflow: 'hidden',
  },
});