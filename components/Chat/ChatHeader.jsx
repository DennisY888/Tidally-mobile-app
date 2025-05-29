// components/Chat/ChatHeader.jsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../constants/Colors';

/**
 * Chat header component displaying user avatar and status
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - User data including name, imageUrl
 * @returns {React.ReactNode}
 */
const ChatHeader = ({ user }) => {
  const { colors } = useTheme();
  
  if (!user) return null;
  
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: user.imageUrl }} 
        style={styles.avatar} 
      />
      <View>
        <Text style={[styles.name, { color: colors.text }]}>
          {user.name}
        </Text>
        <Text style={[styles.status, { color: colors.success }]}>
          Online
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.headline,
  },
  status: {
    ...Typography.caption1,
  },
});

export default ChatHeader;