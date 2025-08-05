import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

const ENHANCED_PALETTES = {
  turtle: {
    oceanMist: {
      name: 'Ocean Mist',
      solid: '#4A90E2',
      gradient: ['#4A90E2', '#7BB3F0'],
    },
    emeraldTide: {
      name: 'Emerald Tide',
      solid: '#2ECB8E',
      gradient: ['#2ECB8E', '#4ECDC4'],
    },
    sunsetCoral: {
      name: 'Sunset Coral',
      solid: '#FF6B9D',
      gradient: ['#FF6B9D', '#FFB347'],
    },
    goldenSand: {
      name: 'Golden Sand',
      solid: '#FFD93D',
      gradient: ['#FFD93D', '#FFAB40'],
    },
  },
  shark: {
    deepBlue: {
      name: 'Deep Blue',
      solid: '#1E3A8A',
      gradient: ['#1E3A8A', '#3B82F6'],
    },
    electricOrange: {
      name: 'Electric Orange',
      solid: '#FF6B35',
      gradient: ['#FF6B35', '#FFB347'],
    },
    neonPink: {
      name: 'Neon Pink',
      solid: '#FF1B8D',
      gradient: ['#FF1B8D', '#FF6B9D'],
    },
    royalPurple: {
      name: 'Royal Purple',
      solid: '#7C3AED',
      gradient: ['#7C3AED', '#A855F7'],
    },
  },
  fish: {
    aquaMarine: {
      name: 'Aqua Marine',
      solid: '#26D0CE',
      gradient: ['#26D0CE', '#4ECDC4'],
    },
    lavenderBloom: {
      name: 'Lavender Bloom',
      solid: '#B19CD9',
      gradient: ['#B19CD9', '#E1BEE7'],
    },
    tiffanyGlow: {
      name: 'Tiffany Glow',
      solid: '#0DD1C5',
      gradient: ['#0DD1C5', '#26D0CE'],
    },
    roseGold: {
      name: 'Rose Gold',
      solid: '#FF8A95',
      gradient: ['#FF8A95', '#FFB347'],
    },
  },
  clam: {
    pearlPink: {
      name: 'Pearl Pink',
      solid: '#FFB3D9',
      gradient: ['#FFB3D9', '#FFC9E6'],
    },
    rubyRed: {
      name: 'Ruby Red',
      solid: '#DC2626',
      gradient: ['#DC2626', '#EF4444'],
    },
    crystalTeal: {
      name: 'Crystal Teal',
      solid: '#0DD1C5',
      gradient: ['#0DD1C5', '#4ECDC4'],
    },
    honeyGold: {
      name: 'Honey Gold',
      solid: '#F59E0B',
      gradient: ['#F59E0B', '#FBBF24'],
    },
  },
  starfish: {
    blushPink: {
      name: 'Blush Pink',
      solid: '#FB7185',
      gradient: ['#FB7185', '#FBBF24'],
    },
    desertSand: {
      name: 'Desert Sand',
      solid: '#D4A574',
      gradient: ['#D4A574', '#F3E5AB'],
    },
    tropicTurquoise: {
      name: 'Tropic Turquoise',
      solid: '#06B6D4',
      gradient: ['#06B6D4', '#0DD1C5'],
    },
    sunburstYellow: {
      name: 'Sunburst Yellow',
      solid: '#FBBF24',
      gradient: ['#FBBF24', '#FFD93D'],
    },
  },
  octopus: {
    midnightBlue: {
      name: 'Midnight Blue',
      solid: '#1E3A8A',
      gradient: ['#1E3A8A', '#312E81'],
    },
    forestGreen: {
      name: 'Forest Green',
      solid: '#15803D',
      gradient: ['#15803D', '#22C55E'],
    },
    magentaDream: {
      name: 'Magenta Dream',
      solid: '#DB2777',
      gradient: ['#DB2777', '#EC4899'],
    },
    amethyst: {
      name: 'Amethyst',
      solid: '#7C3AED',
      gradient: ['#7C3AED', '#9333EA'],
    },
  },
};

export default function EnhancedColorPalettes({ 
  selectedAnimal, 
  backgroundType, 
  onSelectColor, 
  onSelectGradient,
  selectedPalette, 
  onSelectPalette 
}) {
  const { colors, isDark } = useTheme();

  const animalPalettes = selectedAnimal ? ENHANCED_PALETTES[selectedAnimal.key] : {};

  const handlePaletteSelect = (paletteKey, palette) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectPalette(paletteKey);
    
    if (backgroundType === 'solid') {
      onSelectColor(palette.solid);
    } else {
      onSelectGradient(palette.gradient);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Curated for {selectedAnimal?.name}
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.palettesContainer}
      >
        {Object.entries(animalPalettes).map(([key, palette], index) => {
          const isSelected = selectedPalette === key;
          
          return (
            <MotiView
              key={key}
              from={{ opacity: 0, translateX: 30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
                delay: index * 100,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.paletteCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: isSelected ? colors.primary : 'transparent',
                    ...Shadows[isDark ? 'dark' : 'light'].medium,
                  }
                ]}
                onPress={() => handlePaletteSelect(key, palette)}
                activeOpacity={0.8}
              >
                <View style={styles.palettePreview}>
                  {backgroundType === 'solid' ? (
                    <View
                      style={[
                        styles.solidPreview,
                        { backgroundColor: palette.solid }
                      ]}
                    />
                  ) : (
                    <LinearGradient
                      colors={palette.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientPreview}
                    />
                  )}
                </View>
                <Text style={[styles.paletteName, { color: colors.text }]}>
                  {palette.name}
                </Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subhead,
    fontFamily: 'outfit-semibold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  palettesContainer: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  paletteCard: {
    width: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  palettePreview: {
    marginBottom: Spacing.sm,
  },
  solidPreview: {
    width: 60,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  gradientPreview: {
    width: 60,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  paletteName: {
    ...Typography.caption1,
    textAlign: 'center',
    fontFamily: 'outfit-medium',
  },
});