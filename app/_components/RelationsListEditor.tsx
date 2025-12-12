'use client';

import React from "react";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ErrorModal from './ErrorModal';
import { ChangeEvent, useEffect, useState } from "react";
import { CharacterRelations, CharacterID } from '../types';
import { Typeahead } from 'react-bootstrap-typeahead';

import PartnershipService from "../services/partnershipService.js";
import CharacterDataService from "../services/CharacterService.js";


export enum RelationshipType {
    Spouse = 1,
    Concubine = 2,
    Betrothed = 4,
    Lover = 5,
    Parents = 7,
    Child = 8,
    Guardian = 9,
    Ward = 10,
    Mentor = 11,
    Liege = 12,
    Retainer = 13,
    Patron = 14,
    Client = 15,
    Protégé = 16,
    Employer = 17,
    Employee = 18,
    Master = 19,
    Slave = 23,
    Friend = 20,
    Commander = 21,
    Subordinate = 22,
    Sibling = 24,
    Member = 25,
    Peer = 26,
}

interface CharacterUnions { value: number; label: string; }

interface RelationsListEditorProps {
    characterIDs: CharacterID[];
    characterId: number;
}

interface RelationshipEditorProps {
    relation: CharacterRelations;
    characterIDs: CharacterID[];
    characterId: number;
    onRelationChange: (field: string, value: string | number | null) => void;
    unions: CharacterUnions[];
    factions: { value: number; label: string; }[] | [][];
    onDelete: () => void;
}

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({ relation, unions, factions, characterIDs, onRelationChange, onDelete }) => {
    const { type = null, target = null, source = null } = relation;


    const isParental = type === RelationshipType.Parents;
    const isSibling = type === RelationshipType.Sibling;
    const isChild = type === RelationshipType.Child;
    const isMember = type === RelationshipType.Member;
    const isPeer = type == RelationshipType.Peer;

    const targetCharacterName = (isSibling || isPeer) ? characterIDs.find(c => c.id === target)?.name : '';
    const selectedFaction = isMember ? factions.filter(f => f.value === source) : [];

    return (
        <Row className="align-items-center">
            <Col>
                {!isParental && !isSibling && !isChild && !isMember && !isPeer && ( // For standard editable relationships
                    <div className="flex items-center gap-2">
                        <Form.Select
                            style={{ width: 'auto' }}
                            value={type ?? ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => onRelationChange('type', e.target.value)}
                        >
                            <option value="" disabled>Select Relationship</option>
                            <option value={RelationshipType.Spouse}>Spouse</option>
                            <option value={RelationshipType.Concubine}>Concubine</option>
                            <option value={RelationshipType.Betrothed}>Betrothed</option>
                            <option value={RelationshipType.Lover}>Lover</option>
                            <option value={RelationshipType.Parents}>Parents</option>
                            <option value={RelationshipType.Child}>Child</option>
                            <option value={RelationshipType.Guardian}>Guardian</option>
                            <option value={RelationshipType.Ward}>Ward</option>
                            <option value={RelationshipType.Member}>Member</option>
                            <option value={RelationshipType.Mentor}>Mentor</option>
                            <option value={RelationshipType.Liege}>Liege</option>
                            <option value={RelationshipType.Retainer}>Retainer</option>
                            <option value={RelationshipType.Patron}>Patron</option>
                            <option value={RelationshipType.Client}>Client</option>
                            <option value={RelationshipType.Protégé}>Protégé</option>
                            <option value={RelationshipType.Employer}>Employer</option>
                            <option value={RelationshipType.Employee}>Employee</option>
                            <option value={RelationshipType.Master}>Master</option>
                            <option value={RelationshipType.Slave}>Slave</option>
                            <option value={RelationshipType.Friend}>Friend</option>
                            <option value={RelationshipType.Commander}>Commander</option>
                            <option value={RelationshipType.Subordinate}>Subordinate</option>
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
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => onRelationChange('source', e.target.value)}
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
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => onRelationChange('target', e.target.value)}
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
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => onRelationChange('source', e.target.value)}
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
                {isPeer && (
                    <div className="flex items-center">
                        <span>Peer: <strong>{targetCharacterName}</strong></span>
                    </div>
                )}
                {isMember && (
                    <div className="flex items-center flex-wrap gap-2">
                        <span> Member of </span>
                        <Typeahead
                            id="org_combo"
                            labelKey="label"
                            options={factions}
                            defaultSelected={selectedFaction as any[]}
                            allowNew
                            clearButton
                            onChange={(selecte) => { }}
                        />
                    </div>
                )}
            </Col>
            {!isSibling && !isPeer && (
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
    const peerMap = new Map<number, { name: string }>();

    enum DBValue {
        LIASON = 1,
        FACTION = 2,
        PARENT = 1,
        CHILD = 2,
        MEMBER = 3
    };

    for (const union of connections) {

        if (union.type == DBValue.LIASON) {
            // Liasons (Marriages, etc.)
            unions.push({ value: union.id, label: union.participants.filter((p: any) => p.role == 1).map((p: any) => p.name).join(' & ') });
        }
        // Create editable relations for the current character's partners
        if (union.type == DBValue.LIASON) {
            if (union.participants.filter((p: any) => p.role == DBValue.PARENT).some((p: any) => p.id === currentCharacterId)) {
                for (const participant of union.participants.filter((p: any) => p.role == DBValue.PARENT)) {
                    if (participant.id !== currentCharacterId) {
                        let expandedUnion: RelationshipType;
                        if (union.legitimate && union.is_primary) {
                            expandedUnion = RelationshipType.Spouse;
                        }
                        else if (union.legitimate && !union.is_primary) {
                            expandedUnion = RelationshipType.Concubine;
                        }
                        else { // if (!union.legitimate) or other cases
                            expandedUnion = RelationshipType.Lover;
                        }
                        relations.push({ type: expandedUnion, source: union.id, target: participant.id });
                    }
                }
            }

            // Create editable relations for children of this union
            for (const child of union.participants.filter((p: any) => p.role == DBValue.CHILD)) {
                relations.push({ type: RelationshipType.Parents, source: union.id, target: child.id });
            }

            // Find siblings of the current character
            const isCurrentCharChild = union.participants.filter((p: any) => p.role == DBValue.CHILD).some((c: any) => c.id === currentCharacterId);
            if (isCurrentCharChild) {
                for (const sibling of union.participants.filter((p: any) => p.role == DBValue.CHILD)) {
                    if (sibling.id !== currentCharacterId && !siblingMap.has(sibling.id)) {
                        siblingMap.set(sibling.id, { name: sibling.name });
                    }
                }
            }
        } else {
            // Faction
            relations.push({ type: RelationshipType.Member, source: union.id, target: currentCharacterId })
            for (const peer of union.participants.filter((p: any) => p.id !== currentCharacterId)) {
                peerMap.set(peer.id, { name: peer.name })
            }
        }


    }

    // Add all unique siblings as non-editable relations
    siblingMap.forEach((_sibling, id) => {
        relations.push({ type: RelationshipType.Sibling, source: 0, target: id });
    });

    peerMap.forEach((_peer, id) => {
        relations.push({ type: RelationshipType.Peer, source: 0, target: id });
    });

    return { unions, relations };
};

const winnowFactions = (Rawfactions: any[]) => {
    const factions = []
    for (const faction of Rawfactions) {
        factions.push({ value: faction.id, label: faction.name });
    }
    return { factions };
};


const RelationsListEditor: React.FC<RelationsListEditorProps> = ({ characterIDs, characterId }) => {
    // Handle change of a single relation
    const [internalRelations, setInternalRelations] = useState<CharacterRelations[]>([]);
    const [internalUnions, setInternalUnions] = useState<CharacterUnions[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [internalFactions, setInternalFactions] = useState<[]>([]);


    const fetchData = () => {
        if (!characterId) return;

        Promise.all([
            CharacterDataService.getCharacterConnections(characterId, 0),
            PartnershipService.getNamedFactions()
        ]).then(([connResponse, factionResponse]) => {
            const { unions, relations: expandedRelations } = expandRelations(connResponse.data || [], characterId);
            const { factions } = winnowFactions(factionResponse.data);
            setInternalUnions(unions);
            setInternalRelations(expandedRelations);
            setInternalFactions(factions);
        }).catch(e => {
            console.error(e);
            setError("Failed to refresh character connections.");
            setShowErrorModal(true);
        });
    };

    useEffect(() => {
        fetchData();
    }, [characterId]);

    const handleRelationChange = (index: number, field: string, value: string | number | null) => {
        // Parse the string value from the select input into a number or null
        const numericValue = typeof value === 'string' ? (value === '' ? null : parseInt(value, 10)) : value;

        const updated = [...internalRelations];
        const newRelation: CharacterRelations = { ...updated[index], [field]: numericValue };

        // If the type is changed to 'Parents', reset the other fields
        if (field === 'type' && numericValue === RelationshipType.Parents) {
            newRelation.source = null;
            newRelation.target = null;
        }

        // If the relation is 'Child', the target is always the current character
        if (newRelation.type === RelationshipType.Child) {
            newRelation.target = characterId;
        }


        updated[index] = newRelation;
        setInternalRelations(updated);

        // -- API CALL TO UPDATE UNION
        if ([1, 2, 5].includes(newRelation.type as number) && newRelation.source !== null && newRelation.target !== null) {
            const payload = {
                type: 1,
                legitimate: (newRelation.type == 1 || newRelation.type == 2) ? true : false,
                is_primary: newRelation.type === 1,
            };

            PartnershipService.updatePartnership(newRelation.source, payload)
                .then(() => {
                    fetchData(); // Refresh data
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
                is_primary: newRelation.type === 1,
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
                    fetchData(); // Refresh data
                })
                .catch(e => {
                    console.error("Failed to create partnership", e);
                    setError("Failed to create partnership.");
                    setShowErrorModal(true);
                });
        } else if (newRelation.type === RelationshipType.Parents && newRelation.source !== null && newRelation.target !== null) {
            // --- API call for adding the character as a child to a partnershiop
            PartnershipService.addPartnerToPartnership(newRelation.source, [{ character_id: newRelation.target, role: 2 }])
                .then(() => {
                    fetchData(); // Refresh data
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
                    fetchData(); // Trigger the data refresh
                })
                .catch(e => {
                    console.error("Failed to delete relationship from API", e);
                    setError("Failed to delete relationship from API.");
                    setShowErrorModal(true);
                });
        } else {
            const updated = internalRelations.filter((_, i) => i !== index);
            setInternalRelations(updated);
        }
    };

    // Add a new relation
    const handleRelationAdd = () => {
        const newRelations = [...internalRelations, { type: null, source: null, target: null }];
        setInternalRelations(newRelations);
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
                            factions={internalFactions}
                            characterIDs={characterIDs}
                            characterId={characterId}
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