'use client';

import React from "react";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useEffect, useState } from "react";

const SIBLING_RELATIONSHIP_TYPE = 25;
const PARENT_RELATIONSIP_TYPE = 7;


interface CharacterData {
    id: number;
    name: string;
}

interface CharacterUnions { value: number; label: string; }
interface CharacterRelations { type: number; source: number; target: number; }

interface RelationsListEditorProps {
    connections: any[];
    onChange: (newRelations: CharacterRelations[]) => void;
    modifiedRelations: CharacterRelations[] | null;
    characterIDs: CharacterData[];
    characterId: number;
}

interface RelationshipEditorProps {
    relation: CharacterRelations;
    characterIDs: CharacterData[];
    onRelationChange: (field: string, value: string) => void;
    unions: CharacterUnions[];
    onDelete: () => void;
}

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({ relation, unions, characterIDs, onRelationChange, onDelete }) => {
    const { type = "", target = "", source = "" } = relation;


    const isParental = type == PARENT_RELATIONSIP_TYPE; // "Parents"
    const isSibling = type == SIBLING_RELATIONSHIP_TYPE; // "Sibling"
    const targetCharacterName = isSibling ? characterIDs.find(c => c.id == target)?.name : '';

    return (
        <Row className="align-items-center">
            <Col>
                {!isParental && !isSibling && ( // For standard editable relationships
                    <div className="flex items-center gap-2">
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={type}
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
                            value={target}
                            onChange={(e) => onRelationChange('target', e.target.value)}
                        >
                            <option value="" disabled hidden> Select a Character</option>
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
                            value={source}
                            onChange={(e) => onRelationChange('source', e.target.value)}
                        >
                            <option value="" disabled>Select a Parent</option>
                            {unions.map((e) => (
                                <option value={e.value} key={`partner-${e.value}`}> {e.label}</option>
                            ))}
                        </Form.Select>
                        <span>are the Parents of</span>
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={target}
                            onChange={(e) => onRelationChange('target', e.target.value)}
                        >
                            <option value="" disabled hidden> Select a child</option>
                            {characterIDs.map((e) => (
                                <option value={e.id} key={`target-${e.id}`}> {e.name}</option>
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
                        relations.push({ type: union.type, source: union.id, target: participant.id });
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

const RelationsListEditor: React.FC<RelationsListEditorProps> = ({ connections, onChange, modifiedRelations, characterIDs, characterId }) => {
    // Handle change of a single relation
    const [internalRelations, setInternalRelations] = useState<CharacterRelations[]>([]);
    const [internalUnions, setInternalUnions] = useState<CharacterUnions[]>([]);

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
    const handleRelationChange = (index: number, field: string, value: string) => {
        const updated = [...internalRelations];
        const newRelation = { ...updated[index], [field]: value };

        // If the type is changed to 'Parents', reset the other fields
        if (field === 'type' && value == PARENT_RELATIONSIP_TYPE) {
            newRelation.source = "";
            newRelation.target = "";
        }
        updated[index] = newRelation;
        onChange(updated);
    };

    // Delete a relation
    const handleRelationDelete = (index: number) => {
        const updated = internalRelations.filter((_, i) => i !== index);
        onChange(updated);
    };

    // Add a new relation
    const handleRelationAdd = () => {
        const newRelations = [...internalRelations, { type: "", source: "", target: "" }];
        setInternalRelations(newRelations); // Update internal state first
        onChange(newRelations); // Then notify parent
    };




    return (
        <div className="space-y-2">
            {internalRelations && internalRelations.length > 0 && (
                internalRelations.map((relation, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <RelationshipEditor
                            unions={internalUnions}
                            relation={relation}
                            characterIDs={characterIDs}
                            onDelete={() => handleRelationDelete(index)}
                            onRelationChange={(field, value) => handleRelationChange(index, field, value)}
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