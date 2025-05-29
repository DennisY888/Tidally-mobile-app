// components/Home/SliderCard.jsx
/**
 * The Slider component shows featured workouts in a carousel. We're extracting the card rendering to a separate optimized component
 */
import React from 'react';
import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../../constants/Colors';


// Define card dimensions
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 180;


/**
 * SliderCard component for rendering workout cards in the slider
 * Optimized with React.memo and image loading states
 */
const SliderCard = React.memo(({ item, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  

  // Memoize the onPress handler to prevent re-renders
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);
  

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.cardContainer}
      accessibilityLabel={`Featured workout: ${item?.title || 'workout'}`}
    >
      {/* Show loading indicator while image is loading */}
      {imageLoading && (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
        </View>
      )}
      
      <Image 
        source={{ uri: item?.imageUrl }} 
        style={styles.image}
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
        onError={() => {
          setImageLoading(false);
          setImageError(true);
        }}
      />
      
      {/* Show fallback icon if image fails to load */}
      {imageError && (
        <View style={[styles.image, styles.imageError]}>
          <Ionicons name="image-outline" size={32} color={Colors.light.textTertiary} />
          <Text style={styles.errorText}>Image not available</Text>
        </View>
      )}
      
      {/* Gradient overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item?.title || 'Featured Workout'}
          </Text>
          
          <Text style={styles.description} numberOfLines={2}>
            {item?.description || 'Check out this amazing workout'}
          </Text>
          
          <View style={styles.badgeContainer}>
            {item?.tags?.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.badge}>
                <Text style={styles.badgeText}>{tag}</Text>
              </View>
            ))}
            
            {item?.duration && (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>{item.duration} min</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});


const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH, // This should match the value from Slider.jsx
    height: CARD_HEIGHT, // This should match the value from Slider.jsx
    marginHorizontal: 8,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  imagePlaceholder: {
    position: 'absolute',
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageError: {
    position: 'absolute',
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.light.textTertiary,
    marginTop: 8,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  textContainer: {
    padding: 16,
  },
  title: {
    ...Typography.headline,
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    ...Typography.footnote,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginRight: 6,
  },
  timeBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    ...Typography.caption2,
    color: '#fff',
  },
});

export default SliderCard;