// components/Chat/ChatBubble.jsx
import React from 'react';
import { Bubble } from 'react-native-gifted-chat';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, Shadows } from '../../constants/Colors';

/**
 * Custom chat bubble component with Tidally styling
 * 
 * @param {Object} props - GiftedChat Bubble props
 * @returns {React.ReactNode}
 */
const ChatBubble = (props) => {
  const { colors, isDark } = useTheme();
  
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: colors.primary,
          borderTopRightRadius: 0,
          borderTopLeftRadius: BorderRadius.md,
          borderBottomLeftRadius: BorderRadius.md,
          borderBottomRightRadius: BorderRadius.md,
          ...Shadows.small,
          marginVertical: 2,
          marginHorizontal: 3,
        },
        left: {
          backgroundColor: isDark ? colors.backgroundSecondary : colors.background,
          borderTopLeftRadius: 0,
          borderTopRightRadius: BorderRadius.md,
          borderBottomLeftRadius: BorderRadius.md,
          borderBottomRightRadius: BorderRadius.md,
          ...Shadows.small,
          marginVertical: 2,
          marginHorizontal: 3,
        },
      }}
      textStyle={{
        right: {
          color: '#fff',
          fontFamily: 'outfit',
        },
        left: {
          color: colors.text,
          fontFamily: 'outfit',
        },
      }}
      timeTextStyle={{
        right: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontFamily: 'outfit',
          fontSize: 10,
        },
        left: {
          color: colors.textTertiary,
          fontFamily: 'outfit',
          fontSize: 10,
        },
      }}
    />
  );
};

export default ChatBubble;