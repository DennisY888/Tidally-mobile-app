// app/chat-details/index.jsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Text,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day, Time } from 'react-native-gifted-chat';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { useUser } from '@clerk/clerk-expo';

import { Typography, BorderRadius, Shadows, Spacing } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../config/FirebaseConfig';
import ChatHeader from '../../components/Chat/ChatHeader';
import { useChatMessages } from '../../hooks/useChatMessages';

/**
 * Chat Details Screen
 * 
 * Displays a conversation between two users with real-time message updates
 */
export default function ChatScreen() {
  // Hooks and params
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const { colors, isDark } = useTheme();
  
  // State
  const [otherUser, setOtherUser] = useState(null);
  const { messages, loading, addMessage } = useChatMessages(params?.id);
  
  // Setup on component mount
  useEffect(() => {
    fetchChatDetails();
  }, [params?.id]);
  
  /**
   * Fetch chat details including other user info
   */
  const fetchChatDetails = async () => {
    try {
      const docRef = doc(db, 'Chat', params?.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const result = docSnap.data();
        // Find the other user (not the current user)
        const other = result?.users.find(item => 
          item.email !== user?.primaryEmailAddress?.emailAddress
        );
        
        setOtherUser(other);
        updateHeader(other);
      }
    } catch (error) {
      console.error("Error fetching chat details:", error);
    }
  };
  
  /**
   * Update navigation header with user info
   */
  const updateHeader = (other) => {
    navigation.setOptions({
      headerTitle: () => (
        <ChatHeader user={other} />
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  };
  
  /**
   * Handle sending messages
   * @param {Array} newMessages - New messages to send
   */
  const onSend = async (newMessages = []) => {
    try {
      const message = newMessages[0];
      
      // Format the current time
      const formattedTime = moment().format('MM-DD-YYYY HH:mm:ss');
      
      // Add message to Firestore
      await addDoc(collection(db, 'Chat', params.id, 'Messages'), {
        ...message,
        createdAt: formattedTime,
        timestamp: serverTimestamp(), // For ordering
      });
      
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  /**
   * Customize message bubble
   */
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: colors.primary,
          borderTopRightRadius: 0,
          borderTopLeftRadius: BorderRadius.md,
          borderBottomLeftRadius: BorderRadius.md,
          borderBottomRightRadius: BorderRadius.md,
          ...Shadows.small,
          marginVertical: 2,
          marginHorizontal: 3,
        },
        left: {
          backgroundColor: isDark ? colors.backgroundSecondary : colors.background,
          borderTopLeftRadius: 0,
          borderTopRightRadius: BorderRadius.md,
          borderBottomLeftRadius: BorderRadius.md,
          borderBottomRightRadius: BorderRadius.md,
          ...Shadows.small,
          marginVertical: 2,
          marginHorizontal: 3,
        },
      }}
      textStyle={{
        right: {
          color: '#fff',
          fontFamily: 'outfit',
        },
        left: {
          color: colors.text,
          fontFamily: 'outfit',
        },
      }}
      timeTextStyle={{
        right: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontFamily: 'outfit',
          fontSize: 10,
        },
        left: {
          color: colors.textTertiary,
          fontFamily: 'outfit',
          fontSize: 10,
        },
      }}
    />
  );
  
  /**
   * Customize send button
   */
  const renderSend = (props) => (
    <Send
      {...props}
      containerStyle={styles.sendContainer}
    >
      <View style={[styles.sendButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="send" size={20} color="#fff" />
      </View>
    </Send>
  );
  
  /**
   * Customize input toolbar
   */
  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: isDark ? colors.backgroundSecondary : colors.background,
        borderTopColor: colors.divider,
        borderTopWidth: 1,
        padding: 4,
      }}
      primaryStyle={{ alignItems: 'center' }}
    />
  );
  
  /**
   * Customize composer (text input)
   */
  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputStyle={{
        backgroundColor: isDark ? colors.backgroundSecondary : colors.lightGray,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
        marginRight: 8,
        marginVertical: 4,
        color: colors.text,
        fontFamily: 'outfit',
        fontSize: 16,
        ...Shadows.small,
      }}
      placeholderTextColor={colors.textTertiary}
    />
  );
  
  /**
   * Customize day separator
   */
  const renderDay = (props) => (
    <Day
      {...props}
      textStyle={{
        fontFamily: 'outfit',
        fontSize: 12,
        color: colors.textSecondary,
      }}
      wrapperStyle={{
        backgroundColor: colors.backgroundSecondary + '90',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginVertical: 16,
      }}
    />
  );
  
  /**
   * Customize time display
   */
  const renderTime = (props) => (
    <Time
      {...props}
      timeTextStyle={{
        right: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontFamily: 'outfit',
          fontSize: 10,
        },
        left: {
          color: colors.textTertiary,
          fontFamily: 'outfit',
          fontSize: 10,
        },
      }}
    />
  );
  
  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading messages...
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user?.primaryEmailAddress?.emailAddress,
            name: user?.fullName,
            avatar: user?.imageUrl
          }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderDay={renderDay}
          renderTime={renderTime}
          placeholder="Type a message..."
          alwaysShowSend
          showUserAvatar
          inverted={true}
          bottomOffset={Platform.OS === 'ios' ? 30 : 0}
          timeFormat="h:mm A"
          dateFormat="MMM D, YYYY"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 5,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.subhead,
    marginTop: Spacing.md,
  },
});