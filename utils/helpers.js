// utils/helpers.js

import { Platform, Alert, ToastAndroid } from 'react-native';

/**
 * A reusable, cross-platform function to show a short message to the user.
 * This is the single source of truth for all simple notifications in the app.
 * @param {string} message - The message to display.
 */
export const showToast = (message) => {
  if (Platform.OS === 'android') {
    // This is the line I omitted before. We must import ToastAndroid to use it.
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};