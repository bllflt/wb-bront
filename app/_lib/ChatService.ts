'use client';

import type { AxiosResponse } from 'axios';
import http from '../services/api';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

const ChatService = {
    sendMessage: (content: string, storyUuid?: number | null) => {
        const url = storyUuid !== undefined && storyUuid !== null
            ? `/chat/conversation?story_uuid=${storyUuid}`
            : '/chat/conversation';
        return http.post<{ assistant: string }>(url, { content });
    },

    getHistory: async (): Promise<ChatMessage[]> => {
        const raw = await http.post<string[]>('/chat/get_history');
        const messages: ChatMessage[] = (raw.data || []).map((text, index) => ({
            role: index % 2 === 0 ? 'user' : 'assistant',
            content: text,
        }));

        return messages;
    },

};

export default ChatService;