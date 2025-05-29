// hooks/useChatMessages.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from 'firebase/firestore';
import moment from 'moment';
import { db } from '../config/FirebaseConfig';

/**
 * Custom hook for managing chat messages with real-time updates
 *
 * @param {string} chatId - The ID of the chat
 * @returns {Object} Messages data, loading state, and message functions
 */
export const useChatMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    // Create listener for messages subcollection
    const q = query(
      collection(db, 'Chat', chatId, 'Messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt ? moment(data.createdAt, 'MM-DD-YYYY HH:mm:ss').toDate() : new Date(),
          user: {
            id: data.user.id,
            name: data.user.name,
            avatar: data.user.avatar
          },
          sent: true,
          received: true,
        };
      });
      setMessages(messageData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  /**
   * Add a new message to the chat
   * @param {Object} message - The message to add
   * @returns {Promise<void>}
   */
  const addMessage = async (message) => {
    if (!chatId) return;
    const formattedTime = moment().format('MM-DD-YYYY HH:mm:ss');
    await addDoc(collection(db, 'Chat', chatId, 'Messages'), {
      ...message,
      createdAt: formattedTime,
      timestamp: serverTimestamp(), // For ordering
    });
  };

  return {
    messages,
    loading,
    addMessage
  };
};