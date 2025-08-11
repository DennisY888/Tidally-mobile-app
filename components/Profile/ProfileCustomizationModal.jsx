// components/Profile/ProfileCustomizationModal.jsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import ColorPicker from 'react-native-wheel-color-picker';

import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { showToast } from '../../utils/helpers';
import { getAnimalList, getAnimalColors, getSVGComponent, adaptColorForDarkMode } from '../../constants/ProfileIcons';
import ActionButton from '../UI/ActionButton';
import EnhancedColorPalettes from './EnhancedColorPalettes';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');


const generateColorVariations = (baseColor) => {
  // Generate lighter and darker variations of the base color
  const variations = [];
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];
  
  // Generate 6 variations
  for (let i = 0; i < 6; i++) {
    const factor = 0.4 + (i * 0.2); // 0.4, 0.6, 0.8, 1.0, 1.2, 1.4
    const newR = Math.min(255, Math.round(rgb.r * factor));
    const newG = Math.min(255, Math.round(rgb.g * factor));
    const newB = Math.min(255, Math.round(rgb.b * factor));
    variations.push(rgbToHex(newR, newG, newB));
  }
  
  return variations;
};


const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};


const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};


export default function ProfileCustomizationModal({ visible, onClose }) {
  const { colors, isDark } = useTheme();
  const { userProfile, updateUserProfile } = useUserProfile();
  const [step, setStep] = useState(1); 
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const [backgroundColor, setBackgroundColor] = useState(
    userProfile?.customProfile?.backgroundColor || colors.primaryLight
  );
  const [backgroundType, setBackgroundType] = useState(
    userProfile?.customProfile?.backgroundType || 'solid' // ✅ Use existing type
  );
  const [gradientColors, setGradientColors] = useState(
    userProfile?.customProfile?.gradientColors || [
      userProfile?.customProfile?.backgroundColor || colors.primaryLight,
      userProfile?.customProfile?.backgroundColor || colors.primaryLight
    ] // ✅ Use existing gradient or create from background
  );

  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [selectedPalette, setSelectedPalette] = useState(null);


  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (userProfile?.customProfile) {
      setBackgroundColor(userProfile.customProfile.backgroundColor || colors.primaryLight);
      setBackgroundType(userProfile.customProfile.backgroundType || 'solid');
      setGradientColors(
        userProfile.customProfile.gradientColors || [
          userProfile.customProfile.backgroundColor || colors.primaryLight,
          userProfile.customProfile.backgroundColor || colors.primaryLight
        ]
      );
    }
  }, [userProfile, colors.primaryLight]);

  
  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start(() => {
      onClose();
      setStep(1);
      setSelectedAnimal(null);
      setSelectedColor(null);
      setSelectedPalette(null);
      // Reset to profile defaults
      setBackgroundColor(userProfile?.customProfile?.backgroundColor || colors.primaryLight);
      setBackgroundType(userProfile?.customProfile?.backgroundType || 'solid');
      setGradientColors(
        userProfile?.customProfile?.gradientColors || [
          userProfile?.customProfile?.backgroundColor || colors.primaryLight,
          userProfile?.customProfile?.backgroundColor || colors.primaryLight
        ]
      );
    });
  };


  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(step + 1);
  };


  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(step - 1);
  };


  const handleSave = async () => {
    if (!selectedAnimal || !selectedColor) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Prepare background data based on type
      const backgroundData = backgroundType === 'solid' 
        ? {
            backgroundColor,
            backgroundType: 'solid',
            gradientColors: null, // Clear gradient data for solid
          }
        : {
            backgroundColor: gradientColors[0], // Store first color as fallback
            backgroundType: 'gradient',
            gradientColors: gradientColors, // Store full gradient array
          };

      const success = await updateUserProfile({
        customProfile: {
          animalType: selectedAnimal.key,
          animalColor: selectedColor.name,
          ...backgroundData, // Spread the background data
          useCustom: true
        }
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast("Profile updated successfully!");
        handleClose();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("Failed to update profile");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };


  if (!visible) return null;


  const animals = getAnimalList();
  const displayBackgroundColor = isDark ? adaptColorForDarkMode(backgroundColor) : backgroundColor;

  return (
    <View style={styles.modalContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <Animated.View style={[styles.modalContent, { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <View style={styles.headerLeft}>
              {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {step === 1 && "Choose Your Animal"}
              {step === 2 && "Pick a Color"}
              {step === 3 && "Set Background"}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {[1, 2].map((stepNum) => (
              <MotiView
                key={stepNum}
                style={[styles.progressDot, { backgroundColor: stepNum <= step ? colors.primary : colors.divider }]}
                animate={{ scale: stepNum === step ? 1.2 : 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            ))}
          </View>

          {/* Step Content */}
          <View style={styles.content}>
            {/* Combined Step 1 & 2: Animal and Color Selection */}
            {step === 1 && (
            <View style={styles.stepContainer}>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Choose your spirit animal and color
                </Text>
                
                {/* Selected Animal Preview */}
                {selectedAnimal && (
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    style={styles.selectedAnimalContainer}
                >
                    <View style={[styles.selectedAnimalPreview, { backgroundColor: colors.backgroundSecondary }]}>
                    {(() => {
                        const SVGComponent = selectedColor?.component || selectedAnimal.colors[0]?.component;
                        return SVGComponent ? <SVGComponent width={90} height={90} /> : null;
                    })()}
                    </View>
                    <Text style={[styles.selectedAnimalName, { color: colors.text }]}>
                    {selectedAnimal.name}
                    </Text>
                </MotiView>
                )}
                
                {/* Animal Selection Grid */}
                <View style={styles.animalGrid}>
                {animals.map((animal, index) => {
                    const SVGComponent = animal.colors[0]?.component;
                    const isSelected = selectedAnimal?.key === animal.key;
                    
                    return (
                    <MotiView
                        key={animal.key}
                        from={{ opacity: 0, scale: 0.7, translateY: 30 }}
                        animate={{ 
                        opacity: 1, 
                        scale: isSelected ? 1.05 : 1, 
                        translateY: 0 
                        }}
                        transition={{
                        type: 'spring',
                        damping: 18,
                        stiffness: 280,
                        delay: index * 80,
                        }}
                        style={styles.animalCardContainer}
                    >
                        <TouchableOpacity
                        style={[
                            styles.animalCard,
                            {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: isSelected ? colors.primary : 'transparent',
                            ...Shadows[isDark ? 'dark' : 'light'].small,
                            }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedAnimal(animal);
                            setSelectedColor(null); // Reset color when changing animal
                        }}
                        activeOpacity={0.8}
                        >
                        <View style={styles.svgContainer}>
                            {SVGComponent && <SVGComponent width={90} height={90} />}
                        </View>
                        <Text style={[styles.animalName, { color: colors.text }]}>
                            {animal.name}
                        </Text>
                        </TouchableOpacity>
                    </MotiView>
                    );
                })}
                </View>
                
                {/* Color Variants (only show when animal selected) */}
                {selectedAnimal && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 200 }}
                  style={styles.colorVariantsContainer}
                >
                  <Text style={[styles.colorSectionTitle, { color: colors.text }]}>
                    Choose Color
                  </Text>
                  <View style={styles.colorGridContainer}>
                    <View style={styles.colorGrid}>
                      {getAnimalColors(selectedAnimal.key).map((color, index) => {
                        const SVGComponent = color.component;
                        const isSelected = selectedColor?.name === color.name;
                        
                        return (
                          <MotiView
                            key={color.name}
                            from={{ opacity: 0, scale: 0.6 }}
                            animate={{ 
                              opacity: 1, 
                              scale: isSelected ? 1.1 : 1,
                            }}
                            transition={{
                              type: 'spring',
                              damping: 16,
                              stiffness: 320,
                              delay: index * 100,
                            }}
                            style={styles.colorCardWrapper}
                          >
                            <TouchableOpacity
                              style={[
                                styles.colorCard,
                                {
                                  backgroundColor: colors.backgroundSecondary,
                                  borderColor: isSelected ? colors.primary : 'transparent',
                                  ...Shadows[isDark ? 'dark' : 'light'].small,
                                }
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedColor(color);
                                // Auto-advance after selection
                                setTimeout(handleNext, 300);
                              }}
                              activeOpacity={0.8}
                            >
                              <View style={styles.colorPreview}>
                                {SVGComponent && <SVGComponent width={90} height={90} />}
                              </View>
                              <Text style={[styles.colorName, { color: colors.text }]}>
                                {color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          </MotiView>
                        );
                      })}
                    </View>
                  </View>
                </MotiView>
              )}
            </View>
            )}

            {/* Step 2: Enhanced Background Selection */}
            {step === 2 && selectedColor && (
            <View style={styles.stepContainer}>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Customize your profile background
                </Text>
                
                {/* Live Preview with Gradient Support */}
                <MotiView
                  style={[styles.profilePreview, { borderColor: colors.divider }]}
                >
                  {backgroundType === 'gradient' && gradientColors ? (
                    <LinearGradient
                      colors={
                        isDark 
                          ? gradientColors.map(color => adaptColorForDarkMode(color))
                          : gradientColors
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 60 }]}
                    />
                  ) : (
                    <MotiView
                      animate={{ 
                        backgroundColor: backgroundType === 'solid' ? 
                          (isDark ? adaptColorForDarkMode(backgroundColor) : backgroundColor) : 
                          'transparent'
                      }}
                      transition={{ type: 'timing', duration: 200 }} // Smooth color transitions
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 60 }]}
                    />
                  )}
                  
                  {(() => {
                    const SVGComponent = selectedColor.component;
                    return SVGComponent ? <SVGComponent width={90} height={90} /> : null;
                  })()}
                  
                  {/* Add subtle breathing animation for preview */}
                  <MotiView
                    style={styles.previewGlow}
                    animate={{
                      opacity: [0.2, 0.4, 0.2],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      type: 'timing',
                      duration: 2000,
                      repeat: Infinity,
                    }}
                  />
                </MotiView>

                {/* Background Type Selector */}
                <View style={styles.backgroundTypeContainer}>
                {['solid', 'gradient'].map((type) => (
                    <TouchableOpacity
                    key={type}
                    style={[
                        styles.backgroundTypeButton,
                        {
                        backgroundColor: backgroundType === type ? colors.primary : colors.backgroundSecondary,
                        borderColor: colors.primary,
                        }
                    ]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBackgroundType(type);
                    }}
                    >
                    <Text style={[
                        styles.backgroundTypeText,
                        { color: backgroundType === type ? colors.background : colors.text }
                    ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>

                {/* Enhanced Color Palettes */}
                <EnhancedColorPalettes
                selectedAnimal={selectedAnimal}
                backgroundType={backgroundType}
                onSelectColor={(color) => {
                    if (backgroundType === 'solid') {
                    setBackgroundColor(color);
                    } else {
                    setGradientColors([color, gradientColors[1]]);
                    }
                }}
                onSelectGradient={(colors) => setGradientColors(colors)}
                selectedPalette={selectedPalette}
                onSelectPalette={setSelectedPalette}
                />

                {/* Color Wheel Section */}
                <View style={styles.colorWheelSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Custom Colors
                  </Text>
                  
                  {/* Main Color Wheel */}
                  <View style={styles.mainColorWheelContainer}>
                    <ColorPicker
                      color={backgroundType === 'solid' ? backgroundColor : gradientColors[0]}
                      onColorChange={(color) => {
                        if (backgroundType === 'solid') {
                          setBackgroundColor(color);
                        } else {
                          setGradientColors([color, gradientColors[1]]);
                        }
                      }}
                      onColorChangeComplete={(color) => {
                        if (backgroundType === 'solid') {
                          setBackgroundColor(color);
                        } else {
                          setGradientColors([color, gradientColors[1]]);
                        }
                      }}
                      thumbSize={25}
                      sliderSize={25}
                      noSnap={true}
                      useNativeDriver={true}
                      style={styles.colorWheel}
                    />
                  </View>

                  {/* Mini Color Wheel and Color Dots */}
                  <View style={styles.secondaryControlsContainer}>
                    {backgroundType === 'solid' ? (
                      // Solid mode: Show mini wheel for brightness/saturation
                      <View style={styles.solidControlsContainer}>
                        <Text style={[styles.controlLabel, { color: colors.text }]}>Fine Tune</Text>
                        <ColorPicker
                          color={backgroundColor}
                          onColorChange={setBackgroundColor}
                          onColorChangeComplete={setBackgroundColor}
                          thumbSize={20}
                          sliderSize={20}
                          noSnap={true}
                          useNativeDriver={true}
                          style={styles.smallColorWheel}
                        />
                        <View style={styles.colorDotsContainer}>
                          <View style={styles.colorDotsSection}>
                            {generateColorVariations(backgroundColor).map((color, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.colorDot, { backgroundColor: color }]}
                                onPress={() => setBackgroundColor(color)}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    ) : (
                      // Gradient mode: Show two separate controls
                      <View style={styles.gradientControlsContainer}>
                        <View style={styles.gradientColorControl}>
                          <Text style={[styles.gradientLabel, { color: colors.text }]}>Start</Text>
                          <ColorPicker
                            color={gradientColors[0]}
                            onColorChange={(color) => {
                              // ✅ REAL-TIME GRADIENT START COLOR UPDATE
                              setGradientColors([color, gradientColors[1]]);
                            }}
                            onColorChangeComplete={(color) => {
                              setGradientColors([color, gradientColors[1]]);
                            }}
                            thumbSize={20}
                            sliderSize={20}
                            noSnap={true}
                            useNativeDriver={true}
                            style={styles.smallColorWheel}
                          />
                        </View>
                        
                        <View style={styles.gradientColorControl}>
                          <Text style={[styles.gradientLabel, { color: colors.text }]}>End</Text>
                          <ColorPicker
                            color={gradientColors[1]}
                            onColorChange={(color) => {
                              // ✅ REAL-TIME GRADIENT END COLOR UPDATE
                              setGradientColors([gradientColors[0], color]);
                            }}
                            onColorChangeComplete={(color) => {
                              setGradientColors([gradientColors[0], color]);
                            }}
                            thumbSize={20}
                            sliderSize={20}
                            noSnap={true}
                            useNativeDriver={true}
                            style={styles.smallColorWheel}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Fixed Save Button Container */}
                <View style={[styles.saveContainer, { backgroundColor: colors.background }]}>
                <ActionButton
                    title="Save Profile"
                    icon="checkmark-circle"
                    onPress={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.saveButton}
                />
                </View>
            </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 },
  keyboardAvoid: { flex: 1 },
  modalContent: {
    flex: 1,
    marginTop: height * 0.08, // Reduced from 0.15 for more content space
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderBottomWidth: 1 },
  headerLeft: { width: 40, alignItems: 'flex-start' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...Typography.title3, flex: 1, textAlign: 'center' },
  closeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  stepContainer: { flex: 1, paddingTop: Spacing.lg },
  subtitle: { ...Typography.callout, textAlign: 'center', marginBottom: Spacing.xl },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    gap: Spacing.sm, // Reduced from md for better fit
    paddingBottom: Spacing.xl, // Added bottom padding
  },
  animalCardContainer: { 
    width: '31%', // Changed from 48% to fit 3 per row
    aspectRatio: 0.95, // Slightly taller than square
  },
  animalCard: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: BorderRadius.xl, // Changed from lg to xl
    borderWidth: 3, // Changed from 2 to 3
    padding: Spacing.xl, // Changed from lg to xl
  },
  svgContainer: { 
    marginBottom: Spacing.sm, // Changed from sm to md
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  animalName: { ...Typography.subhead, fontFamily: 'outfit-medium', marginBottom: Spacing.sm },
  previewContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  animalPreview: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  colorGrid: { 
    flexDirection: 'row', 
    justifyContent: 'center', // Center the items
    alignItems: 'center',
    gap: Spacing.md, 
    width: '100%',
    maxWidth: 320, // Limit max width to prevent over-stretching
    flexWrap: 'nowrap', // Prevent wrapping
  },
  colorCard: { 
    width: '100%', 
    aspectRatio: 1.2, 
    borderRadius: BorderRadius.md, 
    borderWidth: 2, 
    padding: Spacing.xs, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  colorPreview: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: Spacing.md, 
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', 
  },
  colorName: { ...Typography.subhead, fontFamily: 'outfit-medium', textAlign: 'center' },
  profilePreview: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: Spacing.xl, borderWidth: 4 },
  colorWheelContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg },
  colorWheel: { width: 250, height: 250 },
  saveContainer: { paddingBottom: Spacing.xl },
  saveButton: { marginHorizontal: Spacing.lg },
  colorSelectionContainer: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  customColorSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.subhead,
    fontFamily: 'outfit-medium',
    marginBottom: Spacing.md,
  },
  colorWheelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  colorWheel: {
    width: 200,
    height: 200,
  },
  selectedAnimalContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  selectedAnimalPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    // ...Shadows[isDark ? 'dark' : 'light'].medium,    TODO PROMPT CLAUDE LATER
  },
  selectedAnimalName: {
    ...Typography.subhead,
    fontFamily: 'outfit-medium',
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  animalCardContainer: { 
    width: '31%', 
    aspectRatio: 1,
  },
  animalCard: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: BorderRadius.md, 
    borderWidth: 2, 
    padding: Spacing.sm,
  },
  colorVariantsContainer: {
    marginTop: Spacing.md,
    alignItems: 'center',
    width: '100%', // Ensure full width
  },
  colorSectionTitle: {
    ...Typography.callout,
    fontFamily: 'outfit-medium',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  colorGrid: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: Spacing.md, 
    width: '100%',
    paddingHorizontal: Spacing.lg, 
  },
  colorCard: { 
    width: '23%', // 4 colors in a row
    aspectRatio: 1.2, 
    borderRadius: BorderRadius.md, 
    borderWidth: 2, 
    padding: Spacing.xs, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backgroundTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backgroundTypeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backgroundTypeText: {
    ...Typography.callout,
    fontFamily: 'outfit-medium',
  },
  colorWheelSection: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: Spacing.xxl, // Space for save button
  },
  smallColorWheel: {
    width: 120, // Reduced from 120
    height: 120, // Reduced from 120
  },
  gradientLabel: {
    ...Typography.caption1,
    marginBottom: Spacing.sm,
    fontFamily: 'outfit-medium',
  },
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  colorGridContainer: {
    marginTop: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCardWrapper: {
    flex: 1,
    maxWidth: 70, // Consistent width for each card
    alignItems: 'center',
  },
  mainColorWheelContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  secondaryControlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  solidControlsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  controlLabel: {
    ...Typography.caption1,
    marginBottom: Spacing.sm,
    fontFamily: 'outfit-medium',
  },
  colorDotsContainer: {
    marginTop: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  colorDotsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    maxWidth: 200, // Prevent overflow
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  gradientControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  gradientColorControl: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 150, // Prevent sections from getting too wide
  },
  previewGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 65,
    borderWidth: 2,
  },
});