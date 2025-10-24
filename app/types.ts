export interface CharacterData {
    id: number;
    name: string;
    appearance: string;
    sex: number;
    images: string[];
    roleplaying: string[];
    background: string;
}

export interface CharacterDataWithoutID extends Omit<CharacterData, 'id'> { };

export interface CharacterRelations { type: number | null; source: number | null; target: number | null; }

export interface CharacterID { id: number; name: string; }