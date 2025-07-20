// components/WorkoutPlay/WaveBackground.jsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import Animated, { useAnimatedSensor, SensorType, useAnimatedStyle, withRepeat, withTiming, Easing, useSharedValue, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';


const Particle = ({ i, height }) => {
    const { colors } = useTheme();
    const sv = useSharedValue(0);
    React.useEffect(() => {
        const duration = Math.random() * 8000 + 5000;
        const delay = Math.random() * 5000;
        sv.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sv.value * height }] }));
    return <Animated.View style={[styles.particle, { left: `${Math.random() * 100}%`, width: Math.random() * 4 + 2, height: Math.random() * 4 + 2, backgroundColor: i % 2 === 0 ? colors.accent : colors.secondary }, animatedStyle]} />;
};

const WaveBackground = () => {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const animatedSensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });

  const wavePath1 = Skia.Path.MakeFromSVGString("M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,170.7C960,160,1056,160,1152,176C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
  const wavePath2 = Skia.Path.MakeFromSVGString("M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,208C960,235,1056,245,1152,229.3C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
  const wavePath3 = Skia.Path.MakeFromSVGString("M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,224C672,213,768,171,864,165.3C960,160,1056,192,1152,202.7C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
  const wavePath4 = Skia.Path.MakeFromSVGString("M0,128L40,149.3C80,171,160,213,240,218.7C320,224,400,192,480,165.3C560,139,640,117,720,128C800,139,880,181,960,197.3C1040,213,1120,203,1200,176C1280,149,1360,107,1400,85.3L1440,64L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z");
  
  const animatedParallaxStyle = useAnimatedStyle(() => {
    const translateX = animatedSensor.sensor.value.y * -20;
    const translateY = animatedSensor.sensor.value.x * -20;
    return { transform: [{ translateX }, { translateY }] };
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient colors={[colors.backgroundSecondary, colors.background, colors.primaryLight]} style={StyleSheet.absoluteFillObject} />
      
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedParallaxStyle]}>
          {Array.from({ length: 15 }).map((_, i) => <Particle key={i} i={i} height={height} />)}
          
          <View style={[styles.orb, { top: '10%', right: '-5%', width: 256, height: 256, backgroundColor: colors.accent + '10' }]} />
          <View style={[styles.orb, { bottom: '30%', left: '-10%', width: 320, height: 320, backgroundColor: colors.primary + '10' }]} />
          
          <View style={[styles.lightRay, { left: '25%', transform: [{ rotate: '20deg' }] }]}>
              <LinearGradient colors={[colors.accent + '33', 'transparent']} style={styles.gradientFill} />
          </View>
          <View style={[styles.lightRay, { right: '33%', transform: [{ rotate: '-15deg' }] }]}>
              <LinearGradient colors={[colors.secondary + '22', 'transparent']} style={styles.gradientFill} />
          </View>

          <Canvas style={styles.waveContainer}>
              <Path path={wavePath1} color={`${colors.secondary}33`} />
              <Path path={wavePath2} color={`${colors.primary}4D`} />
              <Path path={wavePath3} color={`${colors.primaryDark}40`} />
              <Path path={wavePath4} color={`${colors.primary}26`} />
          </Canvas>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  particle: { position: 'absolute', borderRadius: 999, top: -10, opacity: 0.4 },
  orb: { position: 'absolute', borderRadius: 999 },
  lightRay: { position: 'absolute', top: 0, width: 200, height: '200%' },
  gradientFill: { flex: 1 },
  waveContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, width: '100%' },
});

export default WaveBackground;