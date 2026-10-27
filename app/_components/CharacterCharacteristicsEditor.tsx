'use client';

import { useEffect, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import CharacterService from '../services/CharacterService';

const characteristicFields = [
    { key: 'intelligence', label: 'Int' },
    { key: 'perception', label: 'Per' },
    { key: 'presence', label: 'Pre' },
    { key: 'communication', label: 'Com' },
    { key: 'strength', label: 'Str' },
    { key: 'stamina', label: 'Sta' },
    { key: 'dexterity', label: 'Dex' },
    { key: 'quickness', label: 'Qik' },
] as const;

type CharacteristicKey = typeof characteristicFields[number]['key'];
type Characteristics = Record<CharacteristicKey, number>;

interface CharacterCharacteristicsEditorProps {
    characterId?: string | number;
}

const emptyCharacteristics: Characteristics = {
    intelligence: 0,
    perception: 0,
    presence: 0,
    communication: 0,
    strength: 0,
    stamina: 0,
    dexterity: 0,
    quickness: 0,
};

export default function CharacterCharacteristicsEditor({
    characterId,
}: CharacterCharacteristicsEditorProps) {
    const activeCharacterId = useRef(characterId);
    activeCharacterId.current = characterId;
    const [characteristics, setCharacteristics] = useState<Characteristics | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<Set<CharacteristicKey>>(new Set());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (characterId === undefined) {
            setLoading(false);
            setCharacteristics(null);
            setSaving(new Set());
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setCharacteristics(null);
        setSaving(new Set());
        setError(null);

        CharacterService.getCharacterCharacteristics(characterId)
            .then(response => {
                if (!cancelled) {
                    setCharacteristics({ ...emptyCharacteristics, ...response.data });
                }
            })
            .catch(fetchError => {
                console.error('Failed to fetch character characteristics:', fetchError);
                if (!cancelled) {
                    setError('Failed to load character characteristics.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [characterId]);

    const updateCharacteristic = async (key: CharacteristicKey, value: number) => {
        if (characterId === undefined || !characteristics) return;

        const previousValue = characteristics[key];
        const requestedCharacterId = String(characterId);
        setCharacteristics(current => current ? { ...current, [key]: value } : current);
        setSaving(current => new Set(current).add(key));
        setError(null);

        try {
            await CharacterService.updateCharacterCharacteristics(characterId, { [key]: value });
        } catch (updateError) {
            console.error(`Failed to update character characteristic "${key}":`, updateError);
            if (String(activeCharacterId.current) === requestedCharacterId) {
                setCharacteristics(current => current ? { ...current, [key]: previousValue } : current);
                setError(`Failed to save ${key}. Please try again.`);
            }
        } finally {
            if (String(activeCharacterId.current) === requestedCharacterId) {
                setSaving(current => {
                    const next = new Set(current);
                    next.delete(key);
                    return next;
                });
            }
        }
    };

    return (
        <div className="col-12">
            {error && <Alert variant="danger" className="mb-2">{error}</Alert>}
            <div className="d-flex flex-wrap align-items-center gap-2">
                <strong>Characteristics:</strong>
                {loading ? (
                    <span>Loading...</span>
                ) : characteristics ? (
                    characteristicFields.map(({ key, label }) => (
                        <div key={key} className="d-flex align-items-center gap-1">
                            <span>{label}</span>
                            <Form.Select
                                size="sm"
                                aria-label={label}
                                value={characteristics[key]}
                                disabled={saving.has(key)}
                                onChange={event => void updateCharacteristic(key, Number(event.target.value))}
                                style={{ width: '4.5rem' }}
                            >
                                {Array.from({ length: 11 }, (_, index) => index - 5).map(value => (
                                    <option key={value} value={value}>
                                        {value > 0 ? `+${value}` : value}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    ))
                ) : characterId === undefined ? (
                    <span>Select a character to edit characteristics.</span>
                ) : null}
            </div>
        </div>
    );
}
