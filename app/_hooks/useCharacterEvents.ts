'use client';

import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { CharacterEditorAction } from './useCharacterEditor';
import { CDProps } from '../_components/ReconcileDescription';

interface UseCharacterEventsProps {
    selectedCharacterId: number | null;
    isAuthenticated: boolean;
    dispatch: Dispatch<CharacterEditorAction>;
    onReconcileEvent: (message: CDProps) => void;
}

function parseEventData(eventData: string) {
    try {
        const parsed = JSON.parse(eventData);
        return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch (error) {
        try {
            return JSON.parse(eventData);
        } catch {
            return null;
        }
    }
}

export function useCharacterEvents({ selectedCharacterId, isAuthenticated, dispatch, onReconcileEvent }: UseCharacterEventsProps) {
    useEffect(() => {
        if (!isAuthenticated || !selectedCharacterId) {
            return;
        }

        const evtSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/events/character/${selectedCharacterId}`, {
            withCredentials: true,
        });

        evtSource.onmessage = (event) => {
            const data = parseEventData(event.data);
            if (!data || typeof data !== 'object') {
                return;
            }

            if (data.topic === 'reconcile') {
                onReconcileEvent(data as CDProps);
                return;
            }

            if (data.topic === 'image' && typeof data.filename === 'string') {
                dispatch({ type: 'ADD_IMAGE', payload: data.filename });
                return;
            }

            const mergePayload = data.payload || data.character || data;
            if (mergePayload && typeof mergePayload === 'object') {
                dispatch({ type: 'MERGE_CHANGES', payload: mergePayload });
            }
        };

        return () => {
            evtSource.close();
        };
    }, [selectedCharacterId, isAuthenticated, dispatch, onReconcileEvent]);
}
