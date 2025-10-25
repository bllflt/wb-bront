'use client';

import React from "react";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ErrorModal from './ErrorModal';
import { useEffect, useState } from "react";
import { CharacterRelations, CharacterID } from '../types';

import PartnershipService from "../services/partnershipService.js";
const SIBLING_RELATIONSHIP_TYPE = 25;
const PARENT_RELATIONSHIP_TYPE = 7;
const CHILD_RELATIONSHIP_TYPE = 8;


interface CharacterUnions { value: number; label: string; }

interface RelationsListEditorProps {
    connections: any[];
    onChange: (newRelations: CharacterRelations[]) => void;
    modifiedRelations: CharacterRelations[] | null;
    characterIDs: CharacterID[];
    characterId: number;
    onDataChange: () => void;
}

interface RelationshipEditorProps {
    relation: CharacterRelations;
    characterIDs: CharacterID[];
    characterId: number;
    onRelationChange: (field: string, value: string) => void;
    onChildSourceChange: (sourceValue: string) => void;
    unions: CharacterUnions[];
    onDelete: () => void;
}

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({ relation, unions, characterIDs, onRelationChange, onChildSourceChange, onDelete }) => {
    const { type = null, target = null, source = null } = relation;


    const isParental = type == PARENT_RELATIONSHIP_TYPE; // "Parents"
    const isSibling = type == SIBLING_RELATIONSHIP_TYPE; // "Sibling"
    const isChild = type == CHILD_RELATIONSHIP_TYPE; // "Child"

    const targetCharacterName = isSibling ? characterIDs.find(c => c.id == target)?.name : '';

    return (
        <Row className="align-items-center">
            <Col>
                {!isParental && !isSibling && !isChild && ( // For standard editable relationships
                    <div className="flex items-center gap-2">
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={type ?? ''}
                            onChange={(e) => onRelationChange('type', e.target.value)}
                        >
                            <option value="" disabled>Select Relationship</option>
                            <option value="1">Spouse</option>
                            <option value="2">Concubine</option>
                            <option value="3">Consort</option>
                            <option value="4">Betrothed</option>
                            <option value="5">Lover</option>
                            <option value="6">Paramour</option>
                            <option value="7">Parents</option>
                            {/* Other non-parental relationships */}
                            <option value="8">Child</option>
                            <option value="9">Guardian</option>
                            <option value="10">Ward</option>
                            <option value="11">Mentor</option>
                            <option value="12">Lord</option>
                            <option value="13">Vassal</option>
                            <option value="14">Patron</option>
                            <option value="15">Client</option>
                            <option value="16">Protégé</option>
                            <option value="17">Employer</option>
                            <option value="18">Employee</option>
                            <option value="19">Master</option>
                            <option value="20">Friend</option>
                            <option value="21">Commander</option>
                            <option value="22">Subordinate</option>
                            <option value="23">Lord</option>
                            <option value="24">Retainer</option>
                        </Form.Select>
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={target ?? ''}
                            onChange={(e) => onRelationChange('target', e.target.value)}
                        >
                            <option value="" disabled hidden>Select a Character</option>
                            {characterIDs.map((e) => {
                                return <option value={e.id} key={e.id}> {e.name}</option>
                            })}
                        </Form.Select>
                    </div>
                )}
                {isParental && ( // For parental relationships
                    <div className="flex items-center flex-wrap gap-2">
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={source ?? ''}
                            onChange={(e) => onRelationChange('source', e.target.value)}
                        >
                            <option value="" disabled>Select a Parent</option>
                            {unions.map((e) => (
                                <option value={e.value} key={`partner-${e.value}`}>{e.label}</option>
                            ))}
                        </Form.Select>
                        <span>are the Parents of</span>
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={target ?? ''}
                            onChange={(e) => onRelationChange('target', e.target.value)}
                        >
                            <option value="" disabled hidden> Select a child</option>
                            {characterIDs.map((e) => (
                                <option value={e.id} key={`target-${e.id}`}> {e.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                )}
                {isChild && (
                    <div className="flex items-center flex-wrap gap-2">
                        <span> is the child of</span>
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={source ?? ''}
                            onChange={(e) => onChildSourceChange(e.target.value)}
                        >
                            <option value="" disabled>Select a Parent</option>
                            {unions.map((e) => (
                                <option value={e.value} key={`partner-${e.value}`}>{e.label}</option>
                            ))}
                        </Form.Select>
                    </div>
                )}
                {isSibling && ( // For sibling relationships (static text)
                    <div className="flex items-center gap-2 p-2">
                        <span>Sibling: <strong>{targetCharacterName}</strong></span>
                    </div>
                )}
            </Col>
            {!isSibling && (
                <Col xs="auto">
                    <button
                        type="button"
                        onClick={onDelete}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                        -
                    </button>
                </Col>
            )}
        </Row>
    )
}

const expandRelations = (connections: any[], currentCharacterId: number) => {
    const unions: CharacterUnions[] = [];
    const relations: CharacterRelations[] = [];
    const siblingMap = new Map<number, { name: string }>();

    for (const union of connections) {
        // Process Unions (Marriages, etc.)
        if ([1, 2].includes(union.type)) {
            unions.push({ value: union.id, label: union.participants.filter((p: any) => p.role == 1).map((p: any) => p.name).join(' & ') });

            // Create editable relations for the current character's partners
            if (union.participants.filter((p: any) => p.role == 1).some((p: any) => p.id === currentCharacterId)) {
                for (const participant of union.participants.filter((p: any) => p.role == 1)) {
                    if (participant.id !== currentCharacterId) {
                        let expandedUnion: number = union.type;
                        if (union.type == 1 && union.legitimate && union.is_primary) {
                            expandedUnion = 1;
                        }
                        else if (union.type == 1 && union.legitimate && !union.is_primary) {
                            expandedUnion = 2;
                        }
                        else if (union.type == 1 && !union.legitimate) {
                            expandedUnion = 5;
                        }
                        relations.push({ type: expandedUnion, source: union.id, target: participant.id });
                    }
                }
            }

            // Create editable relations for children of this union
            for (const child of union.participants.filter((p: any) => p.role == 2)) {
                relations.push({ type: 7, source: union.id, target: child.id });
            }

            // Find siblings of the current character
            const isCurrentCharChild = union.participants.filter((p: any) => p.role == 2).some((c: any) => c.id === currentCharacterId);
            if (isCurrentCharChild) {
                for (const sibling of union.participants.filter((p: any) => p.role == 2)) {
                    if (sibling.id !== currentCharacterId && !siblingMap.has(sibling.id)) {
                        siblingMap.set(sibling.id, { name: sibling.name });
                    }
                }
            }
        }
    }

    // Add all unique siblings as non-editable relations
    siblingMap.forEach((_sibling, id) => {
        relations.push({ type: SIBLING_RELATIONSHIP_TYPE, source: 0, target: id });
    });

    return { unions, relations };
};

const RelationsListEditor: React.FC<RelationsListEditorProps> = ({ connections, onChange, modifiedRelations, characterIDs, characterId, onDataChange }) => {
    // Handle change of a single relation
    const [internalRelations, setInternalRelations] = useState<CharacterRelations[]>([]);
    const [internalUnions, setInternalUnions] = useState<CharacterUnions[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        if (modifiedRelations) {
            // If there are modified relations, use them directly
            setInternalRelations(modifiedRelations);
        } else {
            // Otherwise, expand the initial connections from the API
            const { unions, relations: expandedRelations } = expandRelations(connections, characterId);
            setInternalUnions(unions);
            setInternalRelations(expandedRelations);
        }
    }, [connections, characterId, modifiedRelations]);

    const handleChildSourceChange = (index: number, sourceValue: string) => {
        const numericSourceValue = sourceValue === '' ? null : parseInt(sourceValue, 10);

        const updated = [...internalRelations];
        const newRelation: CharacterRelations = {
            ...updated[index],
            source: numericSourceValue,
            target: characterId, // Atomically set the target to the current character
        };

        updated[index] = newRelation;
        onChange(updated);
    };

    const handleRelationChange = (index: number, field: string, value: string) => {
        // Parse the string value from the select input into a number or null
        const numericValue = value === '' ? null : parseInt(value, 10);

        const updated = [...internalRelations];
        const newRelation: CharacterRelations = { ...updated[index], [field]: numericValue };

        // If the type is changed to 'Parents', reset the other fields
        if (field === 'type' && numericValue === PARENT_RELATIONSHIP_TYPE) {
            newRelation.source = null;
            newRelation.target = null;
        }

        updated[index] = newRelation;
        onChange(updated);

        // -- API CALL TO UPDATE UNION
        if ([1, 2, 5].includes(newRelation.type as number) && newRelation.source !== null && newRelation.target !== null) {
            const payload = {
                type: 1,
                legitimate: (newRelation.type == 1 || newRelation.type == 2) ? true : false,
                is_primary: newRelation.type == 1 ? true : false,
            };

            PartnershipService.updatePartnership(newRelation.source, payload)
                .then(() => {
                    onDataChange(); // Refresh data from parent
                })
                .catch(e => {
                    console.error("Failed to update partnership", e);
                    setError("Failed to update partnership.");
                    setShowErrorModal(true);
                });

        } else if ([1, 2, 5].includes(newRelation.type as number) && newRelation.source === null && newRelation.target !== null) {
            // --- API CALL FOR NEW MATE -- 
            const payload = {
                type: 1,
                legitimate: (newRelation.type == 1 || newRelation.type == 2) ? true : false,
                is_primary: newRelation.type == 1 ? true : false,
            };

            PartnershipService.createPartnership(payload)
                .then(response => {
                    const partnershipId = response.data.id;
                    // Add both the current character and the target character to the new partnership
                    return Promise.all([
                        PartnershipService.addPartnerToPartnership(partnershipId, [
                            { character_id: characterId, role: 1 },
                            { character_id: newRelation.target as number, role: 1 }
                        ]),
                    ]);
                })
                .then(() => {
                    onDataChange(); // Refresh data from parent
                })
                .catch(e => {
                    console.error("Failed to create partnership", e);
                    setError("Failed to create partnership.");
                    setShowErrorModal(true);
                });
        } else if (newRelation.type === 7 && newRelation.source !== null && newRelation.target !== null) {
            // --- API call for adding the character as a child to a partnershiop
            PartnershipService.addPartnerToPartnership(newRelation.source, [{ character_id: newRelation.target, role: 2 }])
                .then(() => {
                    onDataChange(); // Refresh data from parent
                })
                .catch(e => {
                    console.error("Failed to add partner to partnership", e);
                    setError("Failed to add partner to partnership.");
                    setShowErrorModal(true);
                });
        }
    };

    const handleRelationDelete = (index: number) => {
        const relationToDelete = internalRelations[index];

        if (relationToDelete.source !== null) {
            PartnershipService.removePartnerFromPartnership(relationToDelete.source, relationToDelete.target)
                .then(() => {
                    onDataChange(); // Trigger the data refresh in the parent component
                })
                .catch(e => {
                    console.error("Failed to delete relationship from API", e);
                    setError("Failed to delete relationship from API.");
                    setShowErrorModal(true);
                });
        } else {
            const updated = internalRelations.filter((_, i) => i !== index);
            onChange(updated);
        }
    };

    // Add a new relation
    const handleRelationAdd = () => {
        const newRelations = [...internalRelations, { type: null, source: null, target: null }];
        setInternalRelations(newRelations); // Update internal state first
        onChange(newRelations); // Then notify parent
    };

    return (
        <div className="space-y-2">
            <ErrorModal
                show={showErrorModal}
                onHide={() => setShowErrorModal(false)}
                error={error}
            />
            {internalRelations && internalRelations.length > 0 && (
                internalRelations.map((relation, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <RelationshipEditor
                            unions={internalUnions}
                            relation={relation}
                            characterIDs={characterIDs}
                            characterId={characterId}
                            onDelete={() => handleRelationDelete(index)}
                            onRelationChange={(field, value) => handleRelationChange(index, field, value)}
                            onChildSourceChange={(value) => handleChildSourceChange(index, value)}
                        />
                    </div>
                )))
            }
            < button
                type="button"
                onClick={handleRelationAdd}
                className="bg-blue-500 text-white px-3 py-1 rounded"
            >
                + Add Relation
            </button>

            <button
                type="button"
                onClick={() => console.log(internalRelations)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
            >
                Log Relations
            </button>
        </div >
    );
};

export default RelationsListEditor;
``