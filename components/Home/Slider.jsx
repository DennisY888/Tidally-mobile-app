// components/Home/Slider.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 180;

export default function Slider() {
  const [sliderList, setSliderList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  
  // Animation values for loading state
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    GetSliders();
    
    // Start fade-in animation
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const GetSliders = async () => {
    setSliderList([]);
    try {
      const snapshot = await getDocs(collection(db, 'Sliders'));
      const data = snapshot.docs.map(doc => doc.data());
      setSliderList(data);
    } catch (error) {
      console.error("Error fetching sliders:", error);
    }
  };
  
  // Function to handle auto slide
  useEffect(() => {
    let interval;
    
    if (sliderList.length > 1) {
      interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % sliderList.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, 5000); // Change slide every 5 seconds
    }
    
    return () => clearInterval(interval);
  }, [currentIndex, sliderList]);
  
  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );
  
  // Handle when sliding ends
  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setCurrentIndex(index);
  };
  
  const handleSliderPress = (item) => {
    // Navigate to the appropriate screen based on the slider type
    if (item.type === 'workout' && item.workoutId) {
      router.push({
        pathname: '/workout-details',
        params: { id: item.workoutId }
      });
    } else if (item.type === 'category' && item.category) {
      // Handle category navigation or filtering
      console.log("Navigate to category:", item.category);
    } else if (item.url) {
      // Handle external links if applicable
      console.log("External link:", item.url);
    }
  };
  
  // Render slider card
  const renderSliderCard = ({ item, index }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => handleSliderPress(item)}
        style={styles.cardContainer}
      >
        <Image 
          source={{ uri: item?.imageUrl }} 
          style={styles.image}
        />
        
        {/* Gradient overlay for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item?.title || 'Featured Workout'}</Text>
            <Text style={styles.description}>{item?.description || 'Check out this amazing workout'}</Text>
            
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
  };
  
  // Render indicator dots
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {sliderList.map((_, idx) => {
          const inputRange = [
            (idx - 1) * CARD_WIDTH,
            idx * CARD_WIDTH,
            (idx + 1) * CARD_WIDTH,
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });
          
          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: [
              Colors.light.secondaryDark, 
              Colors.light.primary, 
              Colors.light.secondaryDark
            ],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={idx}
              style={[
                styles.dot,
                { width: dotWidth, opacity, backgroundColor },
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={sliderList}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.listContainer}
        renderItem={renderSliderCard}
        keyExtractor={(_, index) => index.toString()}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        ListEmptyComponent={() => (
          <View style={[styles.cardContainer, styles.emptyContainer]}>
            <Ionicons name="fitness" size={40} color={Colors.light.textTertiary} />
            <Text style={styles.emptyText}>Featured workouts coming soon!</Text>
          </View>
        )}
      />
      
      {sliderList.length > 1 && renderDots()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.light.text,
  },
  seeAll: {
    ...Typography.subhead,
    color: Colors.light.primary,
  },
  listContainer: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
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
    padding: Spacing.md,
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
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  emptyContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.callout,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
});