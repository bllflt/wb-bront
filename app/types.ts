export interface CharacterData {
    id: string;
    name: string;
    sex: number;
    roleplaying: string[];
    background: string;
    appearance?: string;
    images?: string[];
}

export interface CharacterDataWithoutID extends Omit<CharacterData, 'id'> { };

export interface CharacterRelations {
    type: number | null;
    source: string | null;
    target: string | null;
    name: string | null;
}

export interface CharacterID { id: string; name: string; }

export type CharacterImage = string;
