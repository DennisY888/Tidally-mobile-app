// constants/ProfileIcons.js
import BlueOctopus from '../assets/profile-icons/blueoctopus.svg';
import BlueShark from '../assets/profile-icons/blueshark.svg';
import BlueTurtle from '../assets/profile-icons/blueturtle.svg';
import GreenFish from '../assets/profile-icons/greenfish.svg';
import GreenOctopus from '../assets/profile-icons/greenoctopus.svg';
import GreenTurtle from '../assets/profile-icons/greenturtle.svg';
import OrangeShark from '../assets/profile-icons/orangeshark.svg';
import PinkClam from '../assets/profile-icons/pinkclam.svg';
import PinkFish from '../assets/profile-icons/pinkfish.svg';
import PinkOctopus from '../assets/profile-icons/pinkoctopus.svg';
import PinkShark from '../assets/profile-icons/pinkshark.svg';
import PinkStar from '../assets/profile-icons/pinkstar.svg';
import PinkTurtle from '../assets/profile-icons/pinkturtle.svg';
import PurpleFish from '../assets/profile-icons/purplefish.svg';
import PurpleOctopus from '../assets/profile-icons/purpleoctopus.svg';
import PurpleShark from '../assets/profile-icons/purpleshark.svg';
import RedClam from '../assets/profile-icons/redclam.svg';
import SandStar from '../assets/profile-icons/sandstar.svg';
import TiffanyClam from '../assets/profile-icons/tiffanyclam.svg';
import TiffanyFish from '../assets/profile-icons/tiffanyfish.svg';
import TurquoiseStar from '../assets/profile-icons/turquoisestar.svg';
import YellowClam from '../assets/profile-icons/yellowclam.svg';
import YellowStar from '../assets/profile-icons/yellowstar.svg';
import YellowTurtle from '../assets/profile-icons/yellowturtle.svg';

// Animal configurations mapped to your exact SVG files
export const PROFILE_ANIMALS = {
  turtle: {
    name: 'Turtle',
    colors: [
      { name: 'blue', component: BlueTurtle },
      { name: 'green', component: GreenTurtle },
      { name: 'pink', component: PinkTurtle },
      { name: 'yellow', component: YellowTurtle }
    ]
  },
  shark: {
    name: 'Shark',
    colors: [
      { name: 'blue', component: BlueShark },
      { name: 'orange', component: OrangeShark },
      { name: 'pink', component: PinkShark },
      { name: 'purple', component: PurpleShark }
    ]
  },
  fish: {
    name: 'Fish',
    colors: [
      { name: 'green', component: GreenFish },
      { name: 'purple', component: PurpleFish },
      { name: 'tiffany', component: TiffanyFish },
      { name: 'pink', component: PinkFish }
    ]
  },
  clam: {
    name: 'Clam',
    colors: [
      { name: 'pink', component: PinkClam },
      { name: 'red', component: RedClam },
      { name: 'tiffany', component: TiffanyClam },
      { name: 'yellow', component: YellowClam }
    ]
  },
  starfish: {
    name: 'Starfish',
    colors: [
      { name: 'pink', component: PinkStar },
      { name: 'sand', component: SandStar },
      { name: 'turquoise', component: TurquoiseStar },
      { name: 'yellow', component: YellowStar }
    ]
  },
  octopus: {
    name: 'Octopus',
    colors: [
      { name: 'blue', component: BlueOctopus },
      { name: 'green', component: GreenOctopus },
      { name: 'pink', component: PinkOctopus },
      { name: 'purple', component: PurpleOctopus }
    ]
  }
};

// Dark mode color adaptation following your theme pattern
export const adaptColorForDarkMode = (hexColor) => {
  // Simple approach: reduce brightness by ~20% for dark mode
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Reduce each component by 20%
  const darkR = Math.max(0, Math.floor(r * 0.8));
  const darkG = Math.max(0, Math.floor(g * 0.8));
  const darkB = Math.max(0, Math.floor(b * 0.8));
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
};

// Utility functions
export const getSVGComponent = (animalType, colorName) => {
  const animal = PROFILE_ANIMALS[animalType];
  if (!animal) return null;
  
  const color = animal.colors.find(c => c.name === colorName);
  return color?.component || null;
};

export const getFirstColorComponent = (animalType) => {
  const animal = PROFILE_ANIMALS[animalType];
  return animal?.colors[0]?.component || null;
};

export const getAnimalList = () => {
  return Object.keys(PROFILE_ANIMALS).map(key => ({
    key,
    ...PROFILE_ANIMALS[key]
  }));
};

export const getAnimalColors = (animalKey) => {
  return PROFILE_ANIMALS[animalKey]?.colors || [];
};