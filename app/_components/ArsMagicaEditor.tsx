'use client';

import React, { useEffect, useState } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import VirtueService from '../services/VirtueService';

interface ArsMagicaEditorProps {
    characterId?: string | number;
    onSave?: () => void;
}

export default function ArsMagicaEditor({ characterId, onSave }: ArsMagicaEditorProps) {
    const [virtueOptions, setVirtueOptions] = useState<any[]>([]);
    const [selectedVirtue, setSelectedVirtue] = useState<any[]>([]);
    const [description, setDescription] = useState<string | null>(null);
    const [loadingList, setLoadingList] = useState<boolean>(false);
    const [loadingDescription, setLoadingDescription] = useState<boolean>(false);
    const [errorList, setErrorList] = useState<string | null>(null);
    const [errorDescription, setErrorDescription] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoadingList(true);
        setErrorList(null);

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
                    setErrorList("Failed to load virtues list.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingList(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSelectionChange = (selected: any[]) => {
        setSelectedVirtue(selected);
        if (!selected || selected.length === 0) {
            setDescription(null);
            setErrorDescription(null);
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
            setDescription(null);
            return;
        }

        setLoadingDescription(true);
        setErrorDescription(null);

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
                setDescription(descText);
            })
            .catch((err: any) => {
                console.error(`Failed to fetch description for virtue "${name}":`, err);
                setErrorDescription(`Failed to fetch description for "${name}".`);
                setDescription(null);
            })
            .finally(() => {
                setLoadingDescription(false);
            });
    };

    return (
        <div className="p-3">
            <Form.Group controlId="virtue-selection" className="mb-3">
                <Form.Label>Virtue</Form.Label>
                {loadingList ? (
                    <div>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading virtues...
                    </div>
                ) : (
                    <Typeahead
                        id="virtue-typeahead"
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
                        placeholder="Select a virtue..."
                        onChange={handleSelectionChange}
                        selected={selectedVirtue}
                    />
                )}
                {errorList && <Alert variant="danger" className="mt-2">{errorList}</Alert>}
            </Form.Group>

            {loadingDescription && (
                <div className="mt-3">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading virtue description...
                </div>
            )}

            {errorDescription && (
                <Alert variant="danger" className="mt-3">{errorDescription}</Alert>
            )}

            {!loadingDescription && description !== null && (
                <div>
                    {description || 'No description available for this virtue.'}

                </div>
            )}
        </div>
    );
}