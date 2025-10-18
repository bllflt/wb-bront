'use client';

import React from "react";
import Form from "react-bootstrap/Form";
import { CharacterUnions } from "../page"; // This line is correct, the error message is misleading.
import { CharacterRelations } from "../page"; // This line is correct, the error message is misleading.


interface CharacterData {
    id: number;
    name: string;
}

interface RelationsListEditorProps {
    relations: CharacterRelations[];
    onChange: (newRelations: Record<string, string>[]) => void;
    characterIDs: CharacterData[];
    unions: CharacterUnions[];
}

interface RelationshipEditorProps {
    relation: CharacterRelations;
    characterIDs: CharacterData[];
    onRelationChange: (field: string, value: string) => void;
    unions: CharacterUnions[];
}

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({ relation, unions, characterIDs, onRelationChange }) => {
    const { type = "", target = "", source = "" } = relation;

    const isParental = type === 7 || type === "7"; // "Parent"

    return (
        <div>
            {!isParental && ( // For non-parental relationships
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
                        <option value="none" disabled hidden> Select a Character</option>
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
                            <option value={e.value} key={`partner-${e.id}`}> {e.label}</option>
                        ))}
                    </Form.Select>
                    <span>are the Parents of</span>
                    <Form.Select
                        style={{ width: 'auto' }}
                        value={target}
                        onChange={(e) => onRelationChange('target', e.target.value)}
                    >
                        <option value="none" disabled hidden> Select a Parent</option>
                        {characterIDs.map((e) => (
                            <option value={e.id} key={`target-${e.id}`}> {e.name}</option>
                        ))}
                    </Form.Select>
                </div>
            )}
        </div>
    )
}

const RelationsListEditor: React.FC<RelationsListEditorProps> = ({ relations, unions, onChange, characterIDs }) => {
    // Handle change of a single relation
    const handleRelationChange = (index: number, field: string, value: string) => {
        const updated = [...relations];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    // Delete a relation
    const handleRelationDelete = (index: number) => {
        const updated = relations.filter((_, i) => i !== index);
        onChange(updated);
    };

    // Add a new relation
    const handleRelationAdd = () => {
        onChange([...relations, { type: '', target: '', partner: '' }]);
    };




    return (
        <div className="space-y-2">
            {relations && relations.length > 0 && (
                relations.map((relation, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <RelationshipEditor
                            unions={unions}
                            relation={relation}
                            characterIDs={characterIDs}
                            onRelationChange={(field, value) => handleRelationChange(index, field, value)}
                        />
                        <button
                            type="button"
                            onClick={() => handleRelationDelete(index)}
                            className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                            -
                        </button>
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
        </div >
    );
};

export default RelationsListEditor;
