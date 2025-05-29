// context/NetworkContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Create context
const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  lastOnline: null,
  cacheExpired: false,
});

/**
 * Network Provider Component
 * Monitors network status and provides it to all children
 */
export const NetworkProvider = ({ children, cacheLifetimeHours = 24 }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const [lastOnline, setLastOnline] = useState(null);
  const [cacheExpired, setCacheExpired] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Load last online timestamp from storage
  useEffect(() => {
    const loadLastOnline = async () => {
      try {
        const savedTimestamp = await AsyncStorage.getItem('lastOnlineTimestamp');
        if (savedTimestamp) {
          const timestamp = parseInt(savedTimestamp, 10);
          setLastOnline(new Date(timestamp));
          
          // Check if cache has expired
          const now = new Date();
          const hoursSinceLastOnline = (now - new Date(timestamp)) / (1000 * 60 * 60);
          setCacheExpired(hoursSinceLastOnline > cacheLifetimeHours);
        }
      } catch (error) {
        console.error('Failed to load last online timestamp:', error);
      }
    };
    
    loadLastOnline();
  }, [cacheLifetimeHours]);
  
  // App state change listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, refresh network info
        NetInfo.fetch().then(handleNetInfoChange);
      }
      setAppState(nextAppState);
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [appState]);
  
  // Handler for network info changes
  const handleNetInfoChange = (state) => {
    setIsConnected(state.isConnected);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);
    
    // Update last online timestamp if connected
    if (state.isConnected && state.isInternetReachable) {
      const now = new Date();
      setLastOnline(now);
      AsyncStorage.setItem('lastOnlineTimestamp', now.getTime().toString())
        .catch(error => console.error('Failed to save last online timestamp:', error));
      
      // Reset cache expired flag
      setCacheExpired(false);
    }
  };
  
  // Subscribe to network info changes
  useEffect(() => {
    // Initial network state
    NetInfo.fetch().then(handleNetInfoChange);
    
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetInfoChange);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Context value
  const value = {
    isConnected,
    isInternetReachable,
    connectionType,
    lastOnline,
    cacheExpired,
    // Helper methods
    isOffline: !isConnected || !isInternetReachable,
    connectionQuality: getConnectionQuality(connectionType),
  };
  
  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

/**
 * Get a simple classification of connection quality
 */
const getConnectionQuality = (type) => {
  if (!type) return 'unknown';
  
  switch (type) {
    case 'wifi':
    case 'ethernet':
      return 'excellent';
    case 'cellular':
      return 'good';
    case 'bluetooth':
    case 'wimax':
      return 'fair';
    case 'none':
    case 'unknown':
    default:
      return 'poor';
  }
};

// Custom hook for using network context
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};