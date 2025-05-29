// components/Chat/ChatComposer.jsx
import React from 'react';
import { Composer } from 'react-native-gifted-chat';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, Shadows } from '../../constants/Colors';

/**
 * Custom chat composer (text input) component with Tidally styling
 * 
 * @param {Object} props - GiftedChat Composer props
 * @returns {React.ReactNode}
 */
const ChatComposer = (props) => {
  const { colors, isDark } = useTheme();
  
  return (
    <Composer
      {...props}
      textInputStyle={{
        backgroundColor: isDark ? colors.backgroundSecondary : colors.lightGray,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
        marginRight: 8,
        marginVertical: 4,
        color: colors.text,
        fontFamily: 'outfit',
        fontSize: 16,
        ...Shadows.small,
      }}
      placeholderTextColor={colors.textTertiary}
    />
  );
};

export default ChatComposer;