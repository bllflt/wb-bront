'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';
import VirtueService from '../services/VirtueService';
import CharacterService from '../services/CharacterService';

interface ArsMagicaEditorProps {
    characterId?: string | number;
    onSave?: () => void;
}

export default function ArsMagicaEditor({ characterId, onSave }: ArsMagicaEditorProps) {
    // Character's assigned virtues
    const [characterVirtues, setCharacterVirtues] = useState<string[]>([]);
    const [loadingCharacterVirtues, setLoadingCharacterVirtues] = useState<boolean>(false);
    const [errorCharacterVirtues, setErrorCharacterVirtues] = useState<string | null>(null);

    // All virtue options for Typeahead
    const [virtueOptions, setVirtueOptions] = useState<any[]>([]);
    const [loadingVirtueOptions, setLoadingVirtueOptions] = useState<boolean>(false);
    const [errorVirtueOptions, setErrorVirtueOptions] = useState<string | null>(null);

    // Selected virtue in Typeahead for adding
    const [selectedAddVirtue, setSelectedAddVirtue] = useState<any[]>([]);
    const [addVirtueDescription, setAddVirtueDescription] = useState<string | null>(null);
    const [addVirtueDetails, setAddVirtueDetails] = useState<string | null>(null);
    const [loadingAddDescription, setLoadingAddDescription] = useState<boolean>(false);

    // Map of virtue names to their descriptions (for ListGroup tooltips)
    const [virtueDescriptions, setVirtueDescriptions] = useState<Record<string, string>>({});

    // Operation states
    const [submittingVirtue, setSubmittingVirtue] = useState<boolean>(false);
    const [deletingVirtue, setDeletingVirtue] = useState<string | null>(null);

    // Helper to fetch and cache virtue description
    const fetchVirtueDescription = useCallback(async (name: string) => {
        if (!name || virtueDescriptions[name] !== undefined) return;
        try {
            const response: any = await VirtueService.get(name);
            const data = response?.data;
            let descText = '';
            if (typeof data === 'string') {
                descText = data;
            } else if (data && typeof data === 'object') {
                descText = data.description ?? '';
                if (!descText && Object.keys(data).length > 0) {
                    descText = JSON.stringify(data, null, 2);
                }
            }
            const finalDesc = descText || 'No description available.';
            setVirtueDescriptions(prev => ({ ...prev, [name]: finalDesc }));
        } catch (err) {
            console.error(`Failed to fetch description for virtue "${name}":`, err);
            setVirtueDescriptions(prev => ({ ...prev, [name]: 'Failed to load description.' }));
        }
    }, [virtueDescriptions]);

    // Load available virtue options for Typeahead dropdown
    useEffect(() => {
        let isMounted = true;
        setLoadingVirtueOptions(true);
        setErrorVirtueOptions(null);

        VirtueService.getAllIDs()
            .then((response: any) => {
                if (isMounted) {
                    const data = response?.data;
                    if (Array.isArray(data)) {
                        setVirtueOptions(data);
                    } else if (data) {
                        setVirtueOptions([data]);
                    } else {
                        setVirtueOptions([]);
                    }
                }
            })
            .catch((err: any) => {
                if (isMounted) {
                    console.error("Failed to fetch virtue IDs:", err);
                    setErrorVirtueOptions("Failed to load available virtues list.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingVirtueOptions(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Load character's virtues list using CharacterService.getCharacterVirtues
    useEffect(() => {
        if (!characterId) {
            setCharacterVirtues([]);
            return;
        }

        let isMounted = true;
        setLoadingCharacterVirtues(true);
        setErrorCharacterVirtues(null);

        CharacterService.getCharacterVirtues(characterId)
            .then((response: any) => {
                if (!isMounted) return;
                const data = response?.data;
                let names: string[] = [];
                if (Array.isArray(data)) {
                    names = data.map((item: any) => typeof item === 'string' ? item : item?.name || String(item));
                } else if (typeof data === 'string') {
                    names = [data];
                } else if (data && typeof data === 'object') {
                    if (Array.isArray(data.virtues)) {
                        names = data.virtues.map((item: any) => typeof item === 'string' ? item : item?.name || String(item));
                    } else if (data.name) {
                        names = [data.name];
                    }
                }
                setCharacterVirtues(names);
                // Pre-fetch descriptions for tooltips
                names.forEach(vName => fetchVirtueDescription(vName));
            })
            .catch((err: any) => {
                if (isMounted) {
                    console.error(`Failed to fetch virtues for character ${characterId}:`, err);
                    setErrorCharacterVirtues("Failed to load character virtues.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingCharacterVirtues(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [characterId, fetchVirtueDescription]);

    // Handle selection change in the Typeahead for adding virtues
    const handleAddSelectionChange = (selected: any[]) => {
        setSelectedAddVirtue(selected);
        if (!selected || selected.length === 0) {
            setAddVirtueDescription(null);
            setAddVirtueDetails(null);
            return;
        }

        const selectedItem = selected[0];
        let name = '';
        if (typeof selectedItem === 'string') {
            name = selectedItem;
        } else if (selectedItem && typeof selectedItem === 'object') {
            name = selectedItem.name ?? selectedItem.id ?? String(selectedItem);
        }

        if (!name) {
            setAddVirtueDescription(null);
            setAddVirtueDetails(null);
            return;
        }

        setLoadingAddDescription(true);
        setAddVirtueDetails(null);

        VirtueService.get(name)
            .then((response: any) => {
                const data = response?.data;
                let descText = '';
                if (typeof data === 'string') {
                    descText = data;
                } else if (data && typeof data === 'object') {
                    descText = data.description ?? '';
                    if (!descText && Object.keys(data).length > 0) {
                        descText = JSON.stringify(data, null, 2);
                    }
                }
                const finalDesc = descText || 'No description available.';
                setAddVirtueDescription(finalDesc);
                if (data && typeof data === 'object') {
                    const details = [data.level, data.category, data.tainted ? 'Tainted' : null]
                        .filter(Boolean)
                        .join(', ');
                    setAddVirtueDetails(details || null);
                }
                setVirtueDescriptions(prev => ({ ...prev, [name]: finalDesc }));
            })
            .catch((err: any) => {
                console.error(`Failed to fetch description for virtue "${name}":`, err);
                setAddVirtueDescription('Failed to load description.');
                setAddVirtueDetails(null);
            })
            .finally(() => {
                setLoadingAddDescription(false);
            });
    };

    // Handler to add selected virtue to the character
    const handleAddVirtue = () => {
        if (!selectedAddVirtue || selectedAddVirtue.length === 0 || !characterId) return;

        const selectedItem = selectedAddVirtue[0];
        let virtueName = typeof selectedItem === 'string'
            ? selectedItem
            : (selectedItem?.name ?? selectedItem?.id ?? String(selectedItem));

        if (!virtueName) return;

        setSubmittingVirtue(true);

        // Stub CRUD call to server
        CharacterService.addCharacterVirtue(characterId, virtueName)
            .then(() => {
                if (!characterVirtues.includes(virtueName)) {
                    setCharacterVirtues(prev => [...prev, virtueName]);
                }
                fetchVirtueDescription(virtueName);
                setSelectedAddVirtue([]);
                setAddVirtueDescription(null);
                if (onSave) onSave();
            })
            .catch((err: any) => {
                console.warn("addCharacterVirtue stub call failed or endpoint not ready:", err);
                // Fallback local update while endpoint is a stub
                if (!characterVirtues.includes(virtueName)) {
                    setCharacterVirtues(prev => [...prev, virtueName]);
                }
                fetchVirtueDescription(virtueName);
                setSelectedAddVirtue([]);
                setAddVirtueDescription(null);
                if (onSave) onSave();
            })
            .finally(() => {
                setSubmittingVirtue(false);
            });
    };

    // Handler to delete a virtue from the character
    const handleDeleteVirtue = (virtueName: string) => {
        if (!characterId) return;

        setDeletingVirtue(virtueName);

        // Stub CRUD call to server
        CharacterService.deleteCharacterVirtue(characterId, virtueName)
            .then(() => {
                setCharacterVirtues(prev => prev.filter(v => v !== virtueName));
                if (onSave) onSave();
            })
            .catch((err: any) => {
                console.warn("deleteCharacterVirtue stub call failed or endpoint not ready:", err);
                // Fallback local update while endpoint is a stub
                setCharacterVirtues(prev => prev.filter(v => v !== virtueName));
                if (onSave) onSave();
            })
            .finally(() => {
                setDeletingVirtue(null);
            });
    };

    return (
        <div className="p-3">
            <h5 className="mb-3">Virtues</h5>

            {loadingCharacterVirtues ? (
                <div className="my-3 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading character virtues...
                </div>
            ) : errorCharacterVirtues ? (
                <Alert variant="danger" className="my-3">{errorCharacterVirtues}</Alert>
            ) : (
                <ListGroup className="mb-4">
                    {characterVirtues.length === 0 ? (
                        <ListGroup.Item className="text-muted fst-italic">
                            No virtues assigned to this character.
                        </ListGroup.Item>
                    ) : (
                        characterVirtues.map((virtueName, idx) => (
                            <ListGroup.Item
                                key={`${virtueName}-${idx}`}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <OverlayTrigger
                                    placement="top"
                                    overlay={
                                        <Tooltip id={`tooltip-virtue-${idx}`}>
                                            {virtueDescriptions[virtueName] || 'Loading description...'}
                                        </Tooltip>
                                    }
                                >
                                    <span style={{ cursor: 'pointer' }} className="fw-medium">
                                        {virtueName}
                                    </span>
                                </OverlayTrigger>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={deletingVirtue === virtueName}
                                    onClick={() => handleDeleteVirtue(virtueName)}
                                >
                                    {deletingVirtue === virtueName ? (
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

            <h6 className="mb-2">Add virtue...</h6>
            <Form.Group controlId="add-virtue-selection" className="mb-3">
                {loadingVirtueOptions ? (
                    <div>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading available virtues...
                    </div>
                ) : (
                    <div className="d-flex align-items-start gap-2">
                        <div className="flex-grow-1">
                            <Typeahead
                                id="add-virtue-typeahead"
                                options={virtueOptions}
                                clearButton={true}
                                labelKey={(option: any) => {
                                    if (typeof option === 'string') return option;
                                    if (option && typeof option === 'object') {
                                        if (option.name != null) return String(option.name);
                                        if (option.id != null) return String(option.id);
                                    }
                                    return '';
                                }}
                                placeholder="Select virtue"
                                onChange={handleAddSelectionChange}
                                selected={selectedAddVirtue}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleAddVirtue}
                            disabled={!selectedAddVirtue || selectedAddVirtue.length === 0 || submittingVirtue || !characterId}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {submittingVirtue ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Adding...
                                </>
                            ) : (
                                'Add Virtue'
                            )}
                        </Button>
                    </div>
                )}
                {errorVirtueOptions && (
                    <Alert variant="danger" className="mt-2">{errorVirtueOptions}</Alert>
                )}
            </Form.Group>

            {loadingAddDescription && (
                <div className="mt-2 mb-3 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading virtue description...
                </div>
            )}

            {addVirtueDescription !== null && !loadingAddDescription && (
                <div className="p-2 mb-3 rounded">
                    {addVirtueDetails && (
                        <div className="mb-2">{addVirtueDetails}</div>
                    )}
                    {addVirtueDescription || 'No description available for this virtue.'}
                </div>
            )}
        </div>
    );
}