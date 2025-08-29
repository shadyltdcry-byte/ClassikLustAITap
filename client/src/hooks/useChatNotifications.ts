import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  message: string;
  senderType: 'user' | 'assistant';
  timestamp: string;
  characterId: string;
}

export function useChatNotifications(userId: string | null) {
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(
    localStorage.getItem(`chat_last_read_${userId}`)
  );
  
  const { data: chatHistory = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat-history', userId, '550e8400-e29b-41d4-a716-446655440002'], // Luna's ID
    enabled: !!userId,
    refetchInterval: 30000, // Check for new messages every 30 seconds (reduced from 5s)
  });

  // Count unread messages from Luna (assistant messages newer than last read)
  const unreadCount = (chatHistory as ChatMessage[]).filter((message: ChatMessage) => {
    const isFromLuna = message.senderType === 'assistant';
    const isNewer = !lastReadTimestamp || message.timestamp > lastReadTimestamp;
    return isFromLuna && isNewer;
  }).length;

  const hasUnreadMessages = unreadCount > 0;

  const markAsRead = () => {
    const now = new Date().toISOString();
    setLastReadTimestamp(now);
    if (userId) {
      localStorage.setItem(`chat_last_read_${userId}`, now);
    }
  };

  return {
    hasUnreadMessages,
    unreadCount,
    markAsRead
  };
}