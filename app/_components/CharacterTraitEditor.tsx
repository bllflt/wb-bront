'use client';

import { useCallback, useEffect, useState } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Spinner from 'react-bootstrap/Spinner';
import Tooltip from 'react-bootstrap/Tooltip';

interface TraitCatalogService {
    getAllIDs: () => Promise<any>;
    get: (name: string) => Promise<any>;
}

interface CharacterTraitEditorProps {
    characterId?: string | number;
    onSave?: () => void;
    singular: 'virtue' | 'flaw';
    plural: 'virtues' | 'flaws';
    catalogService: TraitCatalogService;
    getCharacterTraits: (id: string | number) => Promise<any>;
    addCharacterTrait: (id: string | number, name: string) => Promise<any>;
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

export default function CharacterTraitEditor({
    characterId,
    onSave,
    singular,
    plural,
    catalogService,
    getCharacterTraits,
    addCharacterTrait,
    deleteCharacterTrait,
}: CharacterTraitEditorProps) {
    const title = `${singular[0].toUpperCase()}${singular.slice(1)}`;
    const [characterTraits, setCharacterTraits] = useState<string[]>([]);
    const [loadingCharacterTraits, setLoadingCharacterTraits] = useState(false);
    const [errorCharacterTraits, setErrorCharacterTraits] = useState<string | null>(null);
    const [traitOptions, setTraitOptions] = useState<any[]>([]);
    const [loadingTraitOptions, setLoadingTraitOptions] = useState(false);
    const [errorTraitOptions, setErrorTraitOptions] = useState<string | null>(null);
    const [selectedAddTrait, setSelectedAddTrait] = useState<any[]>([]);
    const [addTraitDescription, setAddTraitDescription] = useState<string | null>(null);
    const [addTraitDetails, setAddTraitDetails] = useState<string | null>(null);
    const [loadingAddDescription, setLoadingAddDescription] = useState(false);
    const [traitDescriptions, setTraitDescriptions] = useState<Record<string, string>>({});
    const [submittingTrait, setSubmittingTrait] = useState(false);
    const [deletingTrait, setDeletingTrait] = useState<string | null>(null);

    const fetchTraitDescription = useCallback(async (name: string) => {
        if (!name || traitDescriptions[name] !== undefined) return;
        try {
            const response = await catalogService.get(name);
            const description = getDescription(response?.data) || 'No description available.';
            setTraitDescriptions(previous => ({ ...previous, [name]: description }));
        } catch (error) {
            console.error(`Failed to fetch description for ${singular} "${name}":`, error);
            setTraitDescriptions(previous => ({ ...previous, [name]: 'Failed to load description.' }));
        }
    }, [catalogService, singular, traitDescriptions]);

    useEffect(() => {
        let isMounted = true;
        setLoadingTraitOptions(true);
        setErrorTraitOptions(null);

        catalogService.getAllIDs()
            .then((response: any) => {
                if (!isMounted) return;
                const data = response?.data;
                if (Array.isArray(data)) {
                    setTraitOptions(data);
                } else {
                    setTraitOptions(data ? [data] : []);
                }
            })
            .catch((error: any) => {
                if (isMounted) {
                    console.error(`Failed to fetch ${singular} IDs:`, error);
                    setErrorTraitOptions(`Failed to load available ${plural} list.`);
                }
            })
            .finally(() => {
                if (isMounted) setLoadingTraitOptions(false);
            });

        return () => {
            isMounted = false;
        };
    }, [catalogService, plural, singular]);

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
                let names: string[] = [];
                if (Array.isArray(data)) {
                    names = data.map(getTraitName);
                } else if (typeof data === 'string') {
                    names = [data];
                } else if (data && typeof data === 'object') {
                    if (Array.isArray(data[plural])) {
                        names = data[plural].map(getTraitName);
                    } else if (data.name) {
                        names = [data.name];
                    }
                }
                setCharacterTraits(names);
                names.forEach(name => fetchTraitDescription(name));
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
        setSelectedAddTrait(selected);
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
                setAddTraitDescription(getDescription(data) || 'No description available.');
                if (data && typeof data === 'object') {
                    const details = [data.level, data.category, data.tainted ? 'Tainted' : null]
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
                console.error(`Failed to fetch description for ${singular} "${name}":`, error);
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

        setSubmittingTrait(true);
        addCharacterTrait(characterId, name)
            .catch((error: any) => {
                console.warn(`addCharacter${title} stub call failed or endpoint not ready:`, error);
            })
            .finally(() => {
                setCharacterTraits(previous => previous.includes(name) ? previous : [...previous, name]);
                fetchTraitDescription(name);
                setSelectedAddTrait([]);
                setAddTraitDescription(null);
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
                setCharacterTraits(previous => previous.filter(trait => trait !== name));
                if (onSave) onSave();
                setDeletingTrait(null);
            });
    };

    return (
        <div className="h-100">
            <h5 className="mb-3">{title}s</h5>

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
                        characterTraits.map((name, index) => (
                            <ListGroup.Item
                                key={`${name}-${index}`}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <OverlayTrigger
                                    placement="top"
                                    overlay={
                                        <Tooltip id={`tooltip-${singular}-${index}`}>
                                            {traitDescriptions[name] || 'Loading description...'}
                                        </Tooltip>
                                    }
                                >
                                    <span style={{ cursor: 'pointer' }} className="fw-medium">
                                        {name}
                                    </span>
                                </OverlayTrigger>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={deletingTrait === name}
                                    onClick={() => handleDeleteTrait(name)}
                                >
                                    {deletingTrait === name ? (
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
                {loadingTraitOptions ? (
                    <div>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading available {plural}...
                    </div>
                ) : (
                    <div className="d-flex align-items-start gap-2">
                        <div className="flex-grow-1">
                            <Typeahead
                                id={`add-${singular}-typeahead`}
                                options={traitOptions}
                                clearButton={true}
                                labelKey={(option: any) => getTraitName(option)}
                                placeholder={`Select ${singular}`}
                                onChange={handleAddSelectionChange}
                                selected={selectedAddTrait}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleAddTrait}
                            disabled={!selectedAddTrait.length || submittingTrait || !characterId}
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
