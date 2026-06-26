'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CharacterDataService from '../services/CharacterService';
import { CharacterID } from '../types';

export function useCharacterSelection(selectedStoryUuid: number | null, isAuthenticated: boolean, loading: boolean) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [characterIDs, setCharacterIDs] = useState<CharacterID[]>([]);

    const refreshCharacterIDs = useCallback(() => {
        if (!isAuthenticated) {
            return Promise.resolve();
        }
        if (!selectedStoryUuid) {
            setCharacterIDs([]);
            return Promise.resolve();
        }
        return CharacterDataService.getAllIDs(selectedStoryUuid)
            .then((response) => setCharacterIDs(response.data))
            .catch((e) => {
                console.error('Failed to load character IDs', e);
            });
    }, [isAuthenticated, selectedStoryUuid]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            return;
        }

        if (!isAuthenticated) {
            return;
        }

        refreshCharacterIDs();
    }, [isAuthenticated, loading, refreshCharacterIDs]);

    const selectedCharacterId = searchParams.get('characterId');

    const handleCharacterChange = useCallback(
        (id: string | null) => {
            const newUrl = id ? `${pathname}?characterId=${id}` : pathname;
            router.push(newUrl);
        },
        [pathname, router],
    );

    return {
        characterIDs,
        selectedCharacterId,
        handleCharacterChange,
        refreshCharacterIDs,
    };
}
