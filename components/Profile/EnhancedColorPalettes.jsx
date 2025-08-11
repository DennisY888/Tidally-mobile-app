// components/Profile/EnhancedColorPalettes.jsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';

const ENHANCED_PALETTES = {
  turtle: {
    oceanDepth: {
      name: 'Ocean Depth',
      solid: '#0760ae', // Blue turtle primary
      gradient: ['#0760ae', '#b6dbfc'], // Blue turtle range
    },
    forestPath: {
      name: 'Forest Path',
      solid: '#294127', // Green turtle primary
      gradient: ['#294127', '#b7c7a7'], // Green turtle range
    },
    blossomPink: {
      name: 'Blossom Pink',
      solid: '#f472c9', // Pink turtle primary
      gradient: ['#f472c9', '#fedff4'], // Pink turtle range
    },
    sunsetGold: {
      name: 'Sunset Gold',
      solid: '#fdc043', // Yellow turtle primary
      gradient: ['#906101', '#fee1a5'], // Yellow turtle range
    },
  },
  shark: {
    abyssalBlue: {
      name: 'Abyssal Blue',
      solid: '#04335e', // Blue shark primary
      gradient: ['#04335e', '#e1f1fe'], // Blue shark range
    },
    moltenOrange: {
      name: 'Molten Orange',
      solid: '#f89257', // Orange shark primary
      gradient: ['#5b3704', '#fde6c7'], // Orange shark range
    },
    roseQuartz: {
      name: 'Rose Quartz',
      solid: '#f472c9', // Pink shark primary
      gradient: ['#980c6a', '#fff1fa'], // Pink shark range
    },
    royalAmethyst: {
      name: 'Royal Amethyst',
      solid: '#954dc9', // Purple shark primary
      gradient: ['#3b1954', '#f0dffc'], // Purple shark range
    },
  },
  fish: {
    emeraldTide: {
      name: 'Emerald Tide',
      solid: '#198a21', // Green fish primary
      gradient: ['#17431a', '#befbc3'], // Green fish range
    },
    mysticViolet: {
      name: 'Mystic Violet',
      solid: '#bf47f5', // Purple fish primary
      gradient: ['#581277', '#faeeff'], // Purple fish range
    },
    tiffanyBreeze: {
      name: 'Tiffany Breeze',
      solid: '#2eedf6', // Tiffany fish primary
      gradient: ['#03565a', '#edfdfe'], // Tiffany fish range
    },
    cherryBlossom: {
      name: 'Cherry Blossom',
      solid: '#d3096b', // Pink fish primary
      gradient: ['#c21a6c', '#fcdfee'], // Pink fish range
    },
  },
  clam: {
    pearlEssence: {
      name: 'Pearl Essence',
      solid: '#f472c9', // Pink clam primary
      gradient: ['#f472c9', '#fceff7'], // Pink clam range
    },
    coralRed: {
      name: 'Coral Red',
      solid: '#f04a4a', // Red clam primary
      gradient: ['#b50b0b', '#fed7d7'], // Red clam range
    },
    crystalLagoon: {
      name: 'Crystal Lagoon',
      solid: '#09ebbb', // Tiffany clam primary
      gradient: ['#08cea4', '#e2fef8'], // Tiffany clam range
    },
    goldenHoney: {
      name: 'Golden Honey',
      solid: '#f9b936', // Yellow clam primary
      gradient: ['#f5aa10', '#fff4df'], // Yellow clam range
    },
  },
  starfish: {
    blushRadiance: {
      name: 'Blush Radiance',
      solid: '#f472c9', // Pink star primary
      gradient: ['#f472c9', '#fefaf8'], // Pink star range
    },
    desertMirage: {
      name: 'Desert Mirage',
      solid: '#e6b594', // Sand star primary
      gradient: ['#e6b594', '#fefaf8'], // Sand star range
    },
    aquaTropic: {
      name: 'Aqua Tropic',
      solid: '#4c8a7d', // Turquoise star primary
      gradient: ['#4c8a7d', '#fefaf8'], // Turquoise star range
    },
    sunburstGlow: {
      name: 'Sunburst Glow',
      solid: '#f5aa10', // Yellow star primary
      gradient: ['#f5aa10', '#fefaf8'], // Yellow star range
    },
  },
  octopus: {
    deepSapphire: {
      name: 'Deep Sapphire',
      solid: '#204c73', // Blue octopus primary
      gradient: ['#204c73', '#b6dbfc'], // Blue octopus range
    },
    forestMystic: {
      name: 'Forest Mystic',
      solid: '#708f68', // Green octopus primary
      gradient: ['#29371d', '#cfe7b8'], // Green octopus range
    },
    roseGarden: {
      name: 'Rose Garden',
      solid: '#c25a9f', // Pink octopus primary
      gradient: ['#a40870', '#fecbed'], // Pink octopus range
    },
    velvetPurple: {
      name: 'Velvet Purple',
      solid: '#581277', // Purple octopus primary
      gradient: ['#581277', '#f6e1ff'], // Purple octopus range
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