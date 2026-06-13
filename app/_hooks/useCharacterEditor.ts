'use client';

import { useCallback, useReducer } from 'react';
import CharacterDataService from '../services/CharacterService';
import { CharacterDataWithoutID } from '../types';

export type CharacterImage = string;

export type CharacterField = keyof CharacterDataWithoutID;

export interface CharacterEditorState {
    selectedCharacterId: number | null;
    character: CharacterDataWithoutID | null;
    loading: boolean;
    error: string | null;
}

export type CharacterEditorAction =
    | { type: 'SET_CHARACTER'; payload: { selectedCharacterId: number | null; character: CharacterDataWithoutID | null } }
    | { type: 'UPDATE_FIELD'; payload: { field: CharacterField; value: string | number | string[] } }
    | { type: 'UPDATE_ARRAY_FIELD'; payload: { field: CharacterField; value: unknown[] } }
    | { type: 'MERGE_CHANGES'; payload: Partial<CharacterDataWithoutID> }
    | { type: 'UPDATE_IMAGES'; payload: CharacterImage[] }
    | { type: 'ADD_IMAGE'; payload: CharacterImage }
    | { type: 'REMOVE_IMAGE'; payload: CharacterImage }
    | { type: 'RESET_CHARACTER' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

const initialCharacter: CharacterDataWithoutID = {
    name: '',
    sex: 9,
    roleplaying: [],
    background: '',
    appearance: '',
    images: [],
};

export const initialEditorState: CharacterEditorState = {
    selectedCharacterId: null,
    character: null,
    loading: false,
    error: null,
};

export function characterEditorReducer(
    state: CharacterEditorState,
    action: CharacterEditorAction,
): CharacterEditorState {
    switch (action.type) {
        case 'SET_CHARACTER':
            return {
                ...state,
                selectedCharacterId: action.payload.selectedCharacterId,
                character: action.payload.character ? { ...initialCharacter, ...action.payload.character } : null,
                loading: false,
                error: null,
            };
        case 'UPDATE_FIELD':
            if (!state.character) return state;
            return {
                ...state,
                character: {
                    ...state.character,
                    [action.payload.field]: action.payload.value,
                },
            };
        case 'UPDATE_ARRAY_FIELD':
            if (!state.character) return state;
            return {
                ...state,
                character: {
                    ...state.character,
                    [action.payload.field]: action.payload.value,
                },
            };
        case 'MERGE_CHANGES':
            if (!state.character) return state;
            return {
                ...state,
                character: {
                    ...state.character,
                    ...action.payload,
                },
            };
        case 'UPDATE_IMAGES':
            if (!state.character) return state;
            return {
                ...state,
                character: {
                    ...state.character,
                    images: action.payload,
                },
            };
        case 'ADD_IMAGE':
            if (!state.character) return state;
            const currentImages = state.character.images || [];
            if (currentImages.includes(action.payload)) {
                return state;
            }
            return {
                ...state,
                character: {
                    ...state.character,
                    images: [...currentImages, action.payload],
                },
            };
        case 'REMOVE_IMAGE':
            if (!state.character) return state;
            return {
                ...state,
                character: {
                    ...state.character,
                    images: (state.character.images || []).filter((image) => image !== action.payload),
                },
            };
        case 'RESET_CHARACTER':
            return {
                ...state,
                selectedCharacterId: null,
                character: { ...initialCharacter },
                error: null,
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
            };
        default:
            return state;
    }
}

export function useCharacterEditor() {
    const [editorState, dispatch] = useReducer(characterEditorReducer, initialEditorState);

    const fetchCharacter = useCallback(async (id: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await CharacterDataService.get(id);
            const { id: charId, ...restOfCharData } = response.data;
            const character: CharacterDataWithoutID = {
                ...restOfCharData,
                appearance: restOfCharData.appearance ?? '',
                images: restOfCharData.images ?? [],
            };
            dispatch({ type: 'SET_CHARACTER', payload: { selectedCharacterId: charId, character } });
            return response.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load character data.' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const saveCharacter = useCallback(async () => {
        if (!editorState.character) return undefined;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            if (editorState.selectedCharacterId) {
                await CharacterDataService.update(editorState.selectedCharacterId, editorState.character);
                return editorState.selectedCharacterId;
            } else {
                const response = await CharacterDataService.create(editorState.character);
                const { id: charId, ...restOfResponseData } = response.data;
                const character: CharacterDataWithoutID = {
                    ...restOfResponseData,
                    appearance: restOfResponseData.appearance ?? '',
                    images: restOfResponseData.images ?? [],
                };
                dispatch({ type: 'SET_CHARACTER', payload: { selectedCharacterId: charId, character } });
                return charId;
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to save character.' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [editorState.character, editorState.selectedCharacterId]);

    const deleteCharacter = useCallback(async () => {
        if (!editorState.selectedCharacterId) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await CharacterDataService.remove(editorState.selectedCharacterId);
            dispatch({ type: 'RESET_CHARACTER' });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to delete character.' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [editorState.selectedCharacterId]);

    const updateField = useCallback((field: CharacterField, value: string | number | string[] | undefined) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { field, value: value ?? '' } });
    }, []);

    const updateArrayField = useCallback((field: CharacterField, value: unknown[]) => {
        dispatch({ type: 'UPDATE_ARRAY_FIELD', payload: { field, value } });
    }, []);

    const mergeChanges = useCallback((changes: Partial<CharacterDataWithoutID>) => {
        dispatch({ type: 'MERGE_CHANGES', payload: changes });
    }, []);

    const resetCharacter = useCallback(() => {
        dispatch({ type: 'RESET_CHARACTER' });
    }, []);

    const setError = useCallback((message: string | null) => {
        dispatch({ type: 'SET_ERROR', payload: message });
    }, []);

    return {
        editorState,
        dispatch,
        fetchCharacter,
        saveCharacter,
        deleteCharacter,
        updateField,
        updateArrayField,
        mergeChanges,
        resetCharacter,
        setError,
    };
}
