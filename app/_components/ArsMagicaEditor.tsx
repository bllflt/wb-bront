'use client';

import CharacterTraitEditor from './CharacterTraitEditor';
import CharacterService from '../services/CharacterService';
import VirtueService from '../services/VirtueService';
import FlawService from '../services/FlawService';

interface ArsMagicaEditorProps {
    characterId?: string | number;
    onSave?: () => void;
}

export default function ArsMagicaEditor({ characterId, onSave }: ArsMagicaEditorProps) {
    return (
        <div className="row g-4 p-3">
            <div className="col-md-6">
                <CharacterTraitEditor
                    characterId={characterId}
                    onSave={onSave}
                    singular="virtue"
                    plural="virtues"
                    catalogService={VirtueService}
                    getCharacterTraits={CharacterService.getCharacterVirtues}
                    addCharacterTrait={CharacterService.addCharacterVirtue}
                    deleteCharacterTrait={CharacterService.deleteCharacterVirtue}
                />
            </div>
            <div className="col-md-6">
                <CharacterTraitEditor
                    characterId={characterId}
                    onSave={onSave}
                    singular="flaw"
                    plural="flaws"
                    catalogService={FlawService}
                    getCharacterTraits={CharacterService.getCharacterFlaws}
                    addCharacterTrait={CharacterService.addCharacterFlaw}
                    deleteCharacterTrait={CharacterService.deleteCharacterFlaw}
                />
            </div>
        </div>
    );
}
