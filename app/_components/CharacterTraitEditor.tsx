'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Spinner from 'react-bootstrap/Spinner';
import Tooltip from 'react-bootstrap/Tooltip';

interface TraitCatalogService {
    get: (name: string) => Promise<any>;
    semanticSearch: (query: string) => Promise<any>;
}

interface AbilityDetails {
    speciality: string | null;
    exp: number | null;
    score: number | null;
}

interface CharacterTrait {
    name: string;
    speciality?: string | null;
    exp?: number | null;
    score?: number | null;
}

interface CharacterTraitEditorProps {
    characterId?: string | number;
    onSave?: () => void;
    singular: 'virtue' | 'flaw' | 'ability';
    plural: 'virtues' | 'flaws' | 'abilities';
    showPoints?: boolean;
    showAbilityFields?: boolean;
    catalogService: TraitCatalogService;
    getCharacterTraits: (id: string | number) => Promise<any>;
    addCharacterTrait: (id: string | number, name: string, details?: AbilityDetails) => Promise<any>;
    deleteCharacterTrait: (id: string | number, name: string) => Promise<any>;
}

function getTraitName(item: any): string {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
        return item.name ?? item.id ?? String(item);
    }
    return '';
}

function getDescription(data: any): string {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
        if (data.description) return data.description;
        if (Object.keys(data).length > 0) return JSON.stringify(data, null, 2);
    }
    return '';
}

function sortCharacterTraits(traits: CharacterTrait[]): CharacterTrait[] {
    const traitsByName = new Map<string, CharacterTrait>();
    traits.forEach(trait => {
        if (trait.name && !traitsByName.has(trait.name)) {
            traitsByName.set(trait.name, trait);
        }
    });
    return [...traitsByName.values()].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
}

function getCharacterTrait(item: any): CharacterTrait {
    if (typeof item === 'string') return { name: item };
    if (item && typeof item === 'object') {
        return {
            name: getTraitName(item),
            speciality: item.speciality ?? null,
            exp: item.exp ?? null,
            score: item.score ?? null,
        };
    }
    return { name: '' };
}

function getTraitPointValue(level: unknown): number | null {
    switch (level) {
        case 'Free':
            return 0;
        case 'Minor':
            return 1;
        case 'Major':
            return 3;
        default:
            return null;
    }
}

export default function CharacterTraitEditor({
    characterId,
    onSave,
    singular,
    plural,
    showPoints = true,
    showAbilityFields = false,
    catalogService,
    getCharacterTraits,
    addCharacterTrait,
    deleteCharacterTrait,
}: CharacterTraitEditorProps) {
    const title = `${plural[0].toUpperCase()}${plural.slice(1)}`;
    const [characterTraits, setCharacterTraits] = useState<CharacterTrait[]>([]);
    const [loadingCharacterTraits, setLoadingCharacterTraits] = useState(false);
    const [errorCharacterTraits, setErrorCharacterTraits] = useState<string | null>(null);
    const [traitOptions, setTraitOptions] = useState<any[]>([]);
    const [loadingTraitOptions, setLoadingTraitOptions] = useState(false);
    const [errorTraitOptions, setErrorTraitOptions] = useState<string | null>(null);
    const searchRequestId = useRef(0);
    const addTraitSelectionRequestId = useRef(0);
    const currentSearchQuery = useRef('');
    const [selectedAddTrait, setSelectedAddTrait] = useState<any[]>([]);
    const [abilitySpeciality, setAbilitySpeciality] = useState('');
    const [abilitySpecialityPlaceholder, setAbilitySpecialityPlaceholder] = useState('Speciality');
    const [abilityExp, setAbilityExp] = useState('');
    const [abilityScore, setAbilityScore] = useState('');
    const [addTraitDescription, setAddTraitDescription] = useState<string | null>(null);
    const [addTraitDetails, setAddTraitDetails] = useState<string | null>(null);
    const [loadingAddDescription, setLoadingAddDescription] = useState(false);
    const [traitDescriptions, setTraitDescriptions] = useState<Record<string, string>>({});
    const [traitPointValues, setTraitPointValues] = useState<Record<string, number | null>>({});
    const [submittingTrait, setSubmittingTrait] = useState(false);
    const [deletingTrait, setDeletingTrait] = useState<string | null>(null);
    const allTraitPointsLoaded = characterTraits.every(trait => Object.prototype.hasOwnProperty.call(traitPointValues, trait.name));
    const traitPointsUnavailable = characterTraits.some(trait => traitPointValues[trait.name] === null);
    const totalTraitPoints = characterTraits.reduce((total, trait) => total + (traitPointValues[trait.name] ?? 0), 0);
    const isOptionalInteger = (value: string) => value === '' || Number.isInteger(Number(value));
    const validAbilityNumbers = isOptionalInteger(abilityExp) && isOptionalInteger(abilityScore);

    const fetchTraitDescription = useCallback(async (name: string) => {
        if (!name || traitDescriptions[name] !== undefined) return;
        try {
            const response = await catalogService.get(name);
            const data = response?.data;
            const description = getDescription(data) || 'No description available.';
            const pointValue = showPoints ? getTraitPointValue(data?.level) : null;
            if (showPoints && pointValue === null) {
                console.warn(`Unexpected ${singular} level for "${name}":`, data?.level);
            }
            if (showPoints) {
                setTraitPointValues(previous => ({ ...previous, [name]: pointValue }));
            }
            setTraitDescriptions(previous => ({ ...previous, [name]: description }));
        } catch (error) {
            console.error(`Failed to fetch description for ${singular} "${name}":`, error);
            if (showPoints) {
                setTraitPointValues(previous => ({ ...previous, [name]: null }));
            }
            setTraitDescriptions(previous => ({ ...previous, [name]: 'Failed to load description.' }));
        }
    }, [catalogService, showPoints, singular, traitDescriptions]);

    const searchTraits = useCallback(async (query: string) => {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length < 2 || normalizedQuery !== currentSearchQuery.current) return;

        const requestId = ++searchRequestId.current;
        setLoadingTraitOptions(true);
        setErrorTraitOptions(null);
        setTraitOptions([]);

        try {
            const response = await catalogService.semanticSearch(normalizedQuery);
            if (requestId !== searchRequestId.current) return;

            if (!Array.isArray(response?.data)) {
                throw new Error(`Unexpected ${plural} search response.`);
            }
            setTraitOptions(response.data);
        } catch (error) {
            if (requestId === searchRequestId.current) {
                console.error(`Failed to search ${plural}:`, error);
                setErrorTraitOptions(`Failed to search available ${plural}.`);
            }
        } finally {
            if (requestId === searchRequestId.current) {
                setLoadingTraitOptions(false);
            }
        }
    }, [catalogService, plural]);

    const handleSearchInputChange = (query: string) => {
        currentSearchQuery.current = query.trim();
        searchRequestId.current += 1;
        setTraitOptions([]);
        setLoadingTraitOptions(false);
        setErrorTraitOptions(null);
    };

    useEffect(() => {
        if (!characterId) {
            setCharacterTraits([]);
            return;
        }

        let isMounted = true;
        setLoadingCharacterTraits(true);
        setErrorCharacterTraits(null);

        getCharacterTraits(characterId)
            .then((response: any) => {
                if (!isMounted) return;
                const data = response?.data;
                let traits: CharacterTrait[] = [];
                if (Array.isArray(data)) {
                    traits = data.map(getCharacterTrait);
                } else if (typeof data === 'string') {
                    traits = [getCharacterTrait(data)];
                } else if (data && typeof data === 'object') {
                    if (Array.isArray(data[plural])) {
                        traits = data[plural].map(getCharacterTrait);
                    } else if (data.name) {
                        traits = [getCharacterTrait(data)];
                    }
                }
                const sortedTraits = sortCharacterTraits(traits);
                setCharacterTraits(sortedTraits);
                sortedTraits.forEach(({ name }) => fetchTraitDescription(name));
            })
            .catch((error: any) => {
                if (isMounted) {
                    console.error(`Failed to fetch ${plural} for character ${characterId}:`, error);
                    setErrorCharacterTraits(`Failed to load character ${plural}.`);
                }
            })
            .finally(() => {
                if (isMounted) setLoadingCharacterTraits(false);
            });

        return () => {
            isMounted = false;
        };
    }, [characterId, fetchTraitDescription, getCharacterTraits, plural]);

    const handleAddSelectionChange = (selected: any[]) => {
        const requestId = ++addTraitSelectionRequestId.current;
        setSelectedAddTrait(selected);
        setAbilitySpecialityPlaceholder('Speciality');
        if (!selected.length) {
            setAddTraitDescription(null);
            setAddTraitDetails(null);
            return;
        }

        const name = getTraitName(selected[0]);
        if (!name) {
            setAddTraitDescription(null);
            setAddTraitDetails(null);
            return;
        }

        setLoadingAddDescription(true);
        setAddTraitDetails(null);

        catalogService.get(name)
            .then((response: any) => {
                const data = response?.data;
                if (requestId !== addTraitSelectionRequestId.current) return;
                const pointValue = showPoints ? getTraitPointValue(data?.level) : null;
                if (showPoints && pointValue === null) {
                    console.warn(`Unexpected ${singular} level for "${name}":`, data?.level);
                }
                if (showAbilityFields && typeof data?.specialties === 'string') {
                    setAbilitySpecialityPlaceholder(data.specialties);
                }
                if (showPoints) {
                    setTraitPointValues(previous => ({ ...previous, [name]: pointValue }));
                }
                setAddTraitDescription(getDescription(data) || 'No description available.');
                if (data && typeof data === 'object') {
                    const details = (singular === 'ability'
                        ? [data.type, data.specialties]
                        : [data.level, data.category, data.tainted ? 'Tainted' : null])
                        .filter(Boolean)
                        .join(', ');
                    setAddTraitDetails(details || null);
                }
                setTraitDescriptions(previous => ({
                    ...previous,
                    [name]: getDescription(data) || 'No description available.',
                }));
            })
            .catch((error: any) => {
                if (requestId !== addTraitSelectionRequestId.current) return;
                console.error(`Failed to fetch description for ${singular} "${name}":`, error);
                if (showPoints) {
                    setTraitPointValues(previous => ({ ...previous, [name]: null }));
                }
                setAddTraitDescription('Failed to load description.');
                setAddTraitDetails(null);
            })
            .finally(() => {
                setLoadingAddDescription(false);
            });
    };

    const handleAddTrait = () => {
        if (!selectedAddTrait.length || !characterId) return;
        const name = getTraitName(selectedAddTrait[0]);
        if (!name) return;

        const details: AbilityDetails | undefined = showAbilityFields
            ? {
                speciality: abilitySpeciality || null,
                exp: abilityExp === '' ? null : Number(abilityExp),
                score: abilityScore === '' ? null : Number(abilityScore),
            }
            : undefined;
        setSubmittingTrait(true);
        addCharacterTrait(characterId, name, details)
            .catch((error: any) => {
                console.warn(`addCharacter${title} stub call failed or endpoint not ready:`, error);
            })
            .finally(() => {
                const addedTrait: CharacterTrait = {
                    name,
                    ...details,
                };
                setCharacterTraits(previous => sortCharacterTraits([
                    ...previous.filter(trait => trait.name !== name),
                    addedTrait,
                ]));
                fetchTraitDescription(name);
                setSelectedAddTrait([]);
                setAddTraitDescription(null);
                setAbilitySpeciality('');
                setAbilitySpecialityPlaceholder('Speciality');
                setAbilityExp('');
                setAbilityScore('');
                if (onSave) onSave();
                setSubmittingTrait(false);
            });
    };

    const handleDeleteTrait = (name: string) => {
        if (!characterId) return;
        setDeletingTrait(name);
        deleteCharacterTrait(characterId, name)
            .catch((error: any) => {
                console.warn(`deleteCharacter${title} stub call failed or endpoint not ready:`, error);
            })
            .finally(() => {
                setCharacterTraits(previous => previous.filter(trait => trait.name !== name));
                if (onSave) onSave();
                setDeletingTrait(null);
            });
    };

    return (
        <div className="h-100">
            <h5 className="mb-3">{title}</h5>
            {showPoints && (
                <div className="mb-3 text-muted" aria-live="polite">
                    points:{' '}
                    {loadingCharacterTraits
                        ? 'Loading...'
                        : errorCharacterTraits
                            ? 'Unavailable'
                            : !allTraitPointsLoaded
                                ? 'Calculating...'
                                : traitPointsUnavailable
                                    ? 'Unavailable'
                                    : totalTraitPoints}
                </div>
            )}

            {loadingCharacterTraits ? (
                <div className="my-3 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading character {plural}...
                </div>
            ) : errorCharacterTraits ? (
                <Alert variant="danger" className="my-3">{errorCharacterTraits}</Alert>
            ) : (
                <ListGroup className="mb-4">
                    {characterTraits.length === 0 ? (
                        <ListGroup.Item className="text-muted fst-italic">
                            No {plural} assigned to this character.
                        </ListGroup.Item>
                    ) : (
                        characterTraits.map((trait, index) => (
                            <ListGroup.Item
                                key={`${trait.name}-${index}`}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <div className="me-3">
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={
                                            <Tooltip id={`tooltip-${singular}-${index}`}>
                                                {traitDescriptions[trait.name] || 'Loading description...'}
                                            </Tooltip>
                                        }
                                    >
                                        <span style={{ cursor: 'pointer' }} className="fw-medium">
                                            {trait.name}
                                        </span>
                                    </OverlayTrigger>
                                    {showAbilityFields && (
                                        <div className="small text-muted">
                                            Speciality: {trait.speciality || '—'} · Exp: {trait.exp ?? '—'} · Score: {trait.score ?? '—'}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={deletingTrait === trait.name}
                                    onClick={() => handleDeleteTrait(trait.name)}
                                >
                                    {deletingTrait === trait.name ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        'Delete'
                                    )}
                                </Button>
                            </ListGroup.Item>
                        ))
                    )}
                </ListGroup>
            )}

            <hr className="my-4" />

            <h6 className="mb-2">Add {singular}...</h6>
            <Form.Group controlId={`add-${singular}-selection`} className="mb-3">
                <div className="row g-2 align-items-start">
                    <div className={showAbilityFields ? 'col-12 col-md-5' : 'col'}>
                        <AsyncTypeahead
                            filterBy={() => true}
                            id={`add-${singular}-typeahead`}
                            options={traitOptions}
                            isLoading={loadingTraitOptions}
                            onSearch={searchTraits}
                            onInputChange={handleSearchInputChange}
                            minLength={2}
                            useCache={false}
                            clearButton={true}
                            labelKey={(option: any) => getTraitName(option)}
                            placeholder={`Search ${singular}`}
                            onChange={handleAddSelectionChange}
                            selected={selectedAddTrait}
                        />
                    </div>
                    {showAbilityFields && (
                        <>
                            <div className="col-12 col-md-3">
                                <Form.Control
                                    aria-label="Ability speciality"
                                    placeholder={abilitySpecialityPlaceholder}
                                    value={abilitySpeciality}
                                    onChange={event => setAbilitySpeciality(event.target.value)}
                                />
                            </div>
                            <div className="col-6 col-md-1">
                                <Form.Control
                                    type="number"
                                    step="1"
                                    aria-label="Ability experience"
                                    placeholder="Exp"
                                    value={abilityExp}
                                    onChange={event => setAbilityExp(event.target.value)}
                                />
                            </div>
                            <div className="col-6 col-md-1">
                                <Form.Control
                                    type="number"
                                    step="1"
                                    aria-label="Ability score"
                                    placeholder="Score"
                                    value={abilityScore}
                                    onChange={event => setAbilityScore(event.target.value)}
                                />
                            </div>
                        </>
                    )}
                    <div className={showAbilityFields ? 'col-12 col-md-2' : 'col-auto'}>
                        <Button
                            variant="primary"
                            onClick={handleAddTrait}
                            disabled={!selectedAddTrait.length || submittingTrait || !characterId || !validAbilityNumbers}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {submittingTrait ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${title}`
                            )}
                        </Button>
                    </div>
                </div>
                {showAbilityFields && !validAbilityNumbers && (
                    <Form.Text className="text-danger">Experience and score must be whole numbers.</Form.Text>
                )}
                {errorTraitOptions && (
                    <Alert variant="danger" className="mt-2">{errorTraitOptions}</Alert>
                )}
            </Form.Group>

            {loadingAddDescription && (
                <div className="mt-2 mb-3 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading {singular} description...
                </div>
            )}

            {addTraitDescription !== null && !loadingAddDescription && (
                <div className="p-2 mb-3 rounded">
                    {addTraitDetails && (
                        <div className="mb-2">{addTraitDetails}</div>
                    )}
                    {addTraitDescription || `No description available for this ${singular}.`}
                </div>
            )}
        </div>
    );
}
