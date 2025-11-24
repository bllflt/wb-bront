'use client';

import http from '../services/api';   

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

const ChatService = {
    sendMessage: (content: string) =>
        http.post<{ assistant: string }>('/chat/conversation', { content }),
};

export default ChatService;