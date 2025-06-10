// components/UI/HighlightedText.jsx
import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const HighlightedText = ({ text = '', highlight = '', style, highlightStyle }) => {
  const { colors } = useTheme();

  // Define a default, theme-aware highlight style.
  // Using the primary color with low opacity is a common and effective choice.
  const defaultHighlightStyle = {
    backgroundColor: colors.primary + '33', // e.g., 'rgba(46, 92, 138, 0.2)'
    borderRadius: 3,
  };

  // If there's no text or no highlight term, just return the normal text.
  if (!highlight || !text || !highlight.trim()) {
    return <Text style={style} numberOfLines={1}>{text}</Text>;
  }
  
  try {
    // Create a case-insensitive regular expression to split the string.
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
      <Text style={style} numberOfLines={1}>
        {/* Filter out empty strings and map over the parts */}
        {parts.filter(String).map((part, i) =>
          // If the part matches the highlight term (case-insensitive)...
          part.toLowerCase() === highlight.toLowerCase() ? (
            // ...render it with the highlight style.
            <Text key={i} style={[defaultHighlightStyle, highlightStyle]}>
              {part}
            </Text>
          ) : (
            // Otherwise, render it as normal text.
            part
          )
        )}
      </Text>
    );
  } catch (e) {
    // Fallback for invalid regex (e.g., if search term contains special characters)
    console.error("HighlightedText regex error:", e);
    return <Text style={style} numberOfLines={1}>{text}</Text>;
  }
};

export default HighlightedText;