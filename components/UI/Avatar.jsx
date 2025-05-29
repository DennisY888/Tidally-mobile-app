// components/UI/Avatar.jsx
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography } from '../../constants/Colors';

export function Avatar({ 
  source, 
  name, 
  size = 'medium', // 'small', 'medium', 'large', 'xlarge'
  style, 
  ...props 
}) {
  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 56;
      case 'xlarge': return 84;
      default: return 44;
    }
  };

  const getInitials = () => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return Typography.caption2;
      case 'large': return Typography.headline;
      case 'xlarge': return Typography.title3;
      default: return Typography.subhead;
    }
  };

  const actualSize = getSize();

  return (
    <View
      style={[
        styles.container,
        {
          width: actualSize,
          height: actualSize,
          borderRadius: actualSize / 2,
        },
        style,
      ]}
      {...props}
    >
      {source?.uri ? (
        <Image
          source={source}
          style={{
            width: actualSize,
            height: actualSize,
            borderRadius: actualSize / 2,
          }}
        />
      ) : (
        <Text style={[getTextSize(), styles.initials]}>{getInitials()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: Colors.light.background,
  },
});