'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Button, ListGroup, Form } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import "react-bootstrap-typeahead/css/Typeahead.css";
import PartnershipService from "../services/partnershipService.js";
import CharacterDataService from "../services/CharacterService.js";
import { CharacterID } from '../types.js';
import Link from 'next/link.js';

// Supported role codes (matching OpenAPI) plus a UI-only 'PARENT'
const ROLE_CODES = [
    "MATE", "CHILD", "MEMBER", "CONCUBINE", "BETROTHED", "PARAMOUR", "GUARDIAN", "WARD",
    "MENTOR", "PROTEGE", "LIEGE", "RETAINER", "PATRON", "CLIENT", "EMPLOYER", "EMPLOYEE",
    "MASTER", "SLAVE", "COMMANDER", "SUBBORDINATE", "FRIEND", "PARENT",
];

const enum PartnershipType {
    LIAISON = 1,
    FACTION = 2
}

// Map roles to their opposites for unnamed partnerships
const OPPOSITE_ROLES: Record<string, string> = {
    'PROTEGE': 'MENTOR',
    'MENTOR': 'PROTEGE',
    'LIEGE': 'RETAINER',
    'RETAINER': 'LIEGE',
    'PATRON': 'CLIENT',
    'CLIENT': 'PATRON',
    'EMPLOYER': 'EMPLOYEE',
    'EMPLOYEE': 'EMPLOYER',
    'MASTER': 'SLAVE',
    'SLAVE': 'MASTER',
    'COMMANDER': 'SUBBORDINATE',
    'SUBBORDINATE': 'COMMANDER',
    'GUARDIAN': 'WARD',
    'WARD': 'GUARDIAN',
    'FRIEND': 'FRIEND',
    'MATE': 'MATE',
    'BETROTHED': 'BETROTHED',
    'CONCUBINE': 'MATE',
    'PARAMOUR': 'PARAMOUR',
};

interface Partnership {
    id: string;
    name: string;
    type: PartnershipType
}

interface Participant {
    id: string;
    name: string;
    role: string;
}

interface Relationship {
    id: string;
    targetCharacterId?: string;
    targetCharacterName?: string;
    relationshipType: string;
    // Partnership context
    partnershipId?: string;
    partnershipName?: string;
    partnershipType?: 1 | 2;
    // For FACTION: list of other members (members of the faction)
    // For LIAISON child entries: siblings
    otherMembers?: Participant[];
    // For LIAISON child entries: list of parent participants
    parents?: Participant[];
}

interface RelationsListEditorProps {
    characterId: string | number;
    availableCharacters: CharacterID[];
    onSave?: (relationships: Relationship[]) => void;
}

export default function RelationsListEditor({
    characterId,
    availableCharacters,
    onSave,
}: RelationsListEditorProps) {
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [myMatePartnerships, setMyMatePartnerships] = useState<{ id: string; label: string }[]>([]);
    const [newRelation, setNewRelation] = useState<Partial<Relationship>>({});
    const [loading, setLoading] = useState(false);

    const getRoleOpposite = (role: string): string => {
        return OPPOSITE_ROLES[role] || role;
    };

    const saveRelationship = async (rel: Relationship) => {
        try {
            const charId = String(characterId);

            // --- FACTION-handling ---
            // Existing faction partnerships should be updated here; if the
            // incoming relationship has no partnershipId it means it is a
            // brand‑new grouping and needs to be created later in the "else"
            // block below.  The previous implementation unconditionally
            // entered this branch and then `continue`ed when there was no
            // partnershipId, which skipped creation for new factions such as
            // LIEGE/PROTEGE roles and free‑form MEMBER groups.
            if (rel.partnershipType === PartnershipType.FACTION && rel.partnershipId) {
                const partnershipId = rel.partnershipId;

                // Check if partnership needs to be created (new faction via typeahead)
                const existsInList = partnerships.some(p => p.id === partnershipId);

                if (!existsInList) {
                    // Create new partnership with given name (should only
                    // happen when the user typed a new group name for a MEMBER)
                    const createResp = await PartnershipService.createPartnership({
                        name: rel.partnershipName,
                        type: PartnershipType.FACTION,
                    });
                    const newPartnershipId = createResp.data.id;

                    // Add current character as MEMBER
                    await PartnershipService.addPartnerToPartnership(newPartnershipId, {
                        character_id: charId,
                        role_code: 'MEMBER',
                    });
                } else {
                    // Add to existing partnership
                    await PartnershipService.addPartnerToPartnership(partnershipId, {
                        character_id: charId,
                        role_code: rel.relationshipType,
                    });
                }
            } else if (rel.relationshipType === 'PARENT') {
                // PARENT case - partnership exists, add child
                const partnershipId = rel.partnershipId;
                if (rel.targetCharacterId) {
                    await PartnershipService.addPartnerToPartnership(partnershipId, {
                        character_id: rel.targetCharacterId,
                        role_code: 'CHILD',
                    });
                }
            } else if (['MATE', 'CONCUBINE', 'PARAMOUR'].includes(rel.relationshipType)) {
                // Romantic/liaison relationships: create LIAISON partnership
                const createResp = await PartnershipService.createPartnership({
                    name: null,
                    type: PartnershipType.LIAISON,
                });
                const newPartnershipId = createResp.data.id;

                // Add both partners in a single call to match backend API
                const oppositeRole = getRoleOpposite(rel.relationshipType);
                await PartnershipService.addPartnerToPartnership(newPartnershipId, [
                    { character_id: charId, role_code: rel.relationshipType },
                    { character_id: rel.targetCharacterId, role_code: oppositeRole },
                ]);
            } else if (rel.partnershipType === PartnershipType.FACTION) {
                // New unnamed faction for a non‑MEMBER role (LIEGE, PROTEGE,
                // FRIEND, etc.) or a user‑entered MEMBER group without an
                // existing partnership id.  We create a new faction and then
                // add both participants (if there is a target character).
                const createResp = await PartnershipService.createPartnership({
                    name: rel.partnershipName || null,
                    type: PartnershipType.FACTION,
                });
                const newPartnershipId = createResp.data.id;

                const partners: any[] = [
                    { character_id: charId, role_code: rel.relationshipType },
                ];
                if (rel.targetCharacterId) {
                    const oppositeRole = getRoleOpposite(rel.relationshipType);
                    partners.push({ character_id: rel.targetCharacterId, role_code: oppositeRole });
                }

                await PartnershipService.addPartnerToPartnership(newPartnershipId, partners);
            }

            // Reload relationships to reflect changes
            const updated = await loadRelationships();

            // Call the optional callback with the fresh data
            onSave?.(updated);
        } catch (error) {
            console.error('Failed to save relationship:', error);
        }
    };

    useEffect(() => {
        loadRelationships();
        loadPartnerships();
    }, [characterId]);

    const loadRelationships = async (): Promise<Relationship[]> => {
        try {
            setLoading(true);
            const response = await CharacterDataService.getCharacterConnections(characterId, 0);

            // Transform partnerships with participants into relationships
            const allRelationships: Relationship[] = [];
            const charId = String(characterId); // Ensure characterId is a string for comparison
            // compute unions where current character is a mate (for parent selection)
            const unions: { id: string; label: string }[] = (response.data || [])
                .filter((p: any) => p.type === 1 && p.participants?.some((x: any) => String(x.id) === charId && ['MATE', 'CONCUBINE', 'PARAMOUR'].includes(x.role)))
                .map((p: any) => {
                    const mates = p.participants
                        .filter((x: any) => ['MATE', 'CONCUBINE', 'PARAMOUR'].includes(x.role))
                        .map((x: any) => x.name)
                        .join(' and ');
                    return { id: String(p.id), label: mates };
                });
            setMyMatePartnerships(unions);

            (response.data || []).forEach((partnership: any) => {
                // helper to normalize role field since API may return `role` or
                // the newer `role_code` property.
                const normalize = (p: any) => ({
                    ...p,
                    role: p.role || p.role_code,
                });

                const myParticipant = partnership.participants
                    ?.map(normalize)
                    .find((p: any) => String(p.id) === charId);

                if (partnership.type === PartnershipType.LIAISON) {
                    const myRole = myParticipant?.role;
                    if (myRole === 'CHILD') {
                        // aggregate parents and siblings
                        const parents = partnership.participants
                            ?.map(normalize)
                            ?.filter((p: any) => ['MATE', 'CONCUBINE', 'PARAMOUR'].includes(p.role))
                            ?.map((p: any) => ({ id: String(p.id), name: p.name, role: p.role })) || [];
                        const siblings = partnership.participants
                            ?.map(normalize)
                            ?.filter((p: any) => p.role === 'CHILD' && String(p.id) !== charId)
                            ?.map((p: any) => ({ id: String(p.id), name: p.name, role: p.role })) || [];
                        allRelationships.push({
                            id: `rel_${partnership.id}_parents`,
                            relationshipType: 'PARENTS',
                            partnershipId: String(partnership.id),
                            partnershipName: partnership.name,
                            partnershipType: 1,
                            parents,
                            otherMembers: siblings,
                        });
                    } else {
                        // non-child: list each other participant individually
                        partnership.participants
                            ?.map(normalize)
                            .forEach((participant: any) => {
                                if (String(participant.id) !== charId) {
                                    allRelationships.push({
                                        id: `rel_${partnership.id}_${participant.id}`,
                                        targetCharacterId: String(participant.id),
                                        targetCharacterName: participant.name,
                                        relationshipType: participant.role,
                                        partnershipId: String(partnership.id),
                                        partnershipName: partnership.name,
                                        partnershipType: 1,
                                    });
                                }
                            });
                    }
                } else if (partnership.type === PartnershipType.FACTION) {
                    // FACTION: for named factions, one entry with other members listed
                    // for unnamed factions, individual entries per member
                    if (partnership.name) {
                        // Named faction: one entry for the partnership with other members listed
                        // We also store the current character id as targetCharacterId so
                        // that removal logic can distinguish which participant to
                        // remove without accidentally deleting the entire group.
                        const otherMembers = partnership.participants
                            ?.map(normalize)
                            ?.filter((p: any) => String(p.id) !== charId)
                            ?.map((p: any) => ({
                                id: String(p.id),
                                name: p.name,
                                role: p.role,
                            })) || [];

                        allRelationships.push({
                            id: `rel_${partnership.id}`,
                            targetCharacterId: charId, // identify ourselves
                            targetCharacterName: myParticipant?.name,
                            relationshipType: myParticipant?.role || 'MEMBER',
                            partnershipId: String(partnership.id),
                            partnershipName: partnership.name,
                            partnershipType: 2,
                            otherMembers,
                        });
                    } else {
                        // Unnamed faction: create individual entries for each other member
                        partnership.participants
                            ?.map(normalize)
                            .forEach((participant: any) => {
                                if (String(participant.id) !== charId) {
                                    allRelationships.push({
                                        id: `rel_${partnership.id}_${participant.id}`,
                                        targetCharacterId: String(participant.id),
                                        targetCharacterName: participant.name,
                                        relationshipType: participant.role,
                                        partnershipId: String(partnership.id),
                                        partnershipName: partnership.name,
                                        partnershipType: 2,
                                    });
                                }
                            });
                    }
                }
            });

            setRelationships(allRelationships);
            return allRelationships;
        } catch (error) {
            console.error('Failed to load relationships:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };


    const loadPartnerships = async () => {
        try {
            // Load all partnerships (both type 1 - LIAISON and type 2 - FACTION)
            const resp = await PartnershipService.getAllPartnerships();
            const parts = (resp.data || []).map((p: any) => ({
                id: String(p.id),
                name: p.name,
                type: p.type,
                participants: p.participants,
            }));
            setPartnerships(parts);
        } catch (err) {
            console.error('Failed to load partnerships:', err);
        }
    };


    const handleAddRelationship = async () => {
        if (!newRelation.relationshipType) return;
        const relType = newRelation.relationshipType;
        let relationship: Relationship = {
            id: `new_${Date.now()}`,
            relationshipType: relType,
        } as any;

        if (relType === 'MEMBER') {
            const existing = partnerships.find(p => p.id === newRelation.partnershipId);
            if (existing) {
                relationship.partnershipId = newRelation.partnershipId;
                relationship.partnershipName = existing.name;
            } else {
                // new, free-form grouping name stored in partnershipName
                relationship.partnershipId = undefined;
                relationship.partnershipName = (newRelation.partnershipName as string) || (newRelation.partnershipId as string) || '';
            }
            relationship.partnershipType = 2;
            // for consistency with loaded data, mark us as the "target" of this
            // relation so removal logic can work uniformly later on.
            relationship.targetCharacterId = String(characterId);
            relationship.targetCharacterName = availableCharacters.find(c => c.id === characterId)?.name;
        } else if (relType === 'PARENT') {
            // union select stored in partnershipId, child select in targetCharacterId
            relationship.partnershipId = newRelation.partnershipId;
            relationship.partnershipName = myMatePartnerships.find(u => u.id === newRelation.partnershipId)?.label;
            relationship.partnershipType = 1;
            relationship.targetCharacterId = String(newRelation.targetCharacterId);
            relationship.targetCharacterName = availableCharacters.find(c => c.id === newRelation.targetCharacterId)?.name;
        } else {
            relationship.targetCharacterId = String(newRelation.targetCharacterId);
            relationship.targetCharacterName = availableCharacters.find(c => c.id === newRelation.targetCharacterId)?.name;
            // MATE, CONCUBINE, PARAMOUR are LIAISON; others are FACTION
            relationship.partnershipType = ['MATE', 'CONCUBINE', 'PARAMOUR'].includes(relType) ? 1 : 2;
        }

        // Add to local state
        setRelationships([...relationships, relationship]);
        setNewRelation({});

        // Automatically save the new relationship
        try {
            setLoading(true);
            await saveRelationship(relationship);
        } catch (error) {
            console.error('Failed to auto-save relationship:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveRelationship = async (rel: Relationship) => {
        // remove from local state immediately for responsiveness
        setRelationships(relationships.filter((r) => r.id !== rel.id));

        // nothing to do for unsaved relationships
        if (rel.id.startsWith('new_')) {
            return;
        }

        try {
            // decide which API call to make based on partnership type and context
            if (rel.partnershipType === PartnershipType.LIAISON) {
                if (rel.relationshipType === 'PARENTS') {
                    // entire liaison partnership (parents & children) should be removed
                    await PartnershipService.deletePartnership(rel.partnershipId as string);
                } else {
                    // remove only the specific partner from the liaison
                    if (rel.targetCharacterId) {
                        await PartnershipService.removePartnerFromPartnership(
                            rel.partnershipId as string,
                            rel.targetCharacterId
                        );
                    } else {
                        // fallback: delete whole partnership
                        await PartnershipService.deletePartnership(rel.partnershipId as string);
                    }
                }
            } else if (rel.partnershipType === PartnershipType.FACTION) {
                // common case: unnamed faction (no name) -> delete the partnership itself
                if (!rel.partnershipName) {
                    await PartnershipService.deletePartnership(rel.partnershipId as string);
                } else {
                    // named faction: remove *this* character from the group.  We
                    // might already have a targetCharacterId (see above) but if
                    // not fall back to the component prop.
                    const charToRemove = rel.targetCharacterId || characterId;
                    await PartnershipService.removePartnerFromPartnership(
                        rel.partnershipId as string,
                        charToRemove
                    );
                }
            }

            // note: we don't automatically reload all relationships here to avoid
            // wiping out any unsaved additions the user may have made.  The list
            // has already been updated locally above.
        } catch (error) {
            console.error('Failed to delete relationship:', error);
        }
    };



    return (
        <Container className="my-4">

            <ListGroup className="mb-4">
                {relationships.map((rel) => (
                    <ListGroup.Item key={rel.id}>
                        <Row className="mb-2">
                            {rel.partnershipType === PartnershipType.LIAISON ? (
                                rel.relationshipType === 'PARENTS' ? (
                                    // child entry showing parents and siblings
                                    <>
                                        <Col md={6}>
                                            <Form.Label>Parents</Form.Label>
                                            <div className="pt-2">
                                                {rel.parents?.map((p, idx) => (
                                                    <span key={p.id}>
                                                        <Link href={`/?characterId=${p.id}`}>{p.name}</Link>
                                                        {idx < (rel.parents?.length || 0) - 1 ? ' and ' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={6} className="d-flex align-items-start">
                                            <div>
                                                {rel.otherMembers && rel.otherMembers.length > 0 && (
                                                    <>
                                                        <small className="text-muted">Siblings:</small>
                                                        <ul className="mb-0 ps-3">
                                                            {rel.otherMembers.map((sib) => (
                                                                <li key={sib.id}><Link href={`/?characterId=${sib.id}`}>{sib.name}</Link></li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={12} className="mt-2">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveRelationship(rel)}
                                            >
                                                Remove
                                            </Button>
                                        </Col>
                                    </>
                                ) : (
                                    // default liaison display
                                    <>
                                        {rel.relationshipType === 'PARENT' ? (
                                            // parent-of-child via union
                                            <>
                                                <Col md={6}>
                                                    <div className="pt-2">
                                                        Parent of <strong>{rel.targetCharacterName}</strong> via <strong>{rel.partnershipName}</strong>
                                                    </div>
                                                </Col>
                                                <Col md={2} className="d-flex align-items-end">
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveRelationship(rel)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Col>
                                            </>
                                        ) : (
                                            <>
                                                <Col md={4}>
                                                    <div className="pt-2"><Link href={`/?characterId=${rel.targetCharacterId}`}>{rel.targetCharacterName}</Link></div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="pt-2">{rel.relationshipType}</div>
                                                </Col>
                                                <Col md={2} className="d-flex align-items-end">
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveRelationship(rel)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Col>
                                            </>
                                        )}
                                    </>
                                )
                            ) : (
                                // FACTION: determine if named or unnamed
                                <>
                                    {!rel.partnershipName ? (
                                        // unnamed faction - display like a liaison row
                                        <>
                                            <Col md={4}>
                                                <div className="pt-2"><Link href={`/?characterId=${rel.targetCharacterId}`}>{rel.targetCharacterName}</Link></div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="pt-2">{rel.relationshipType}</div>
                                            </Col>
                                            <Col md={2} className="d-flex align-items-end">
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveRelationship(rel)}
                                                >
                                                    Remove
                                                </Button>
                                            </Col>
                                        </>
                                    ) : (
                                        // named faction with possibly other members on the side
                                        <>
                                            <Col md={6}>
                                                <div className="pt-2 mb-0">
                                                    <strong>{rel.relationshipType}</strong> of <strong>{rel.partnershipName}</strong>
                                                </div>
                                            </Col>
                                            <Col md={6} className="d-flex align-items-start">
                                                <div>
                                                    {rel.otherMembers && rel.otherMembers.length > 0 && (
                                                        <>
                                                            <small className="text-muted">Other members:</small>
                                                            <ul className="mb-0 ps-3">
                                                                {rel.otherMembers.map((member) => (
                                                                    <li key={member.id}><Link href={`/?characterId=${member.id}`}>{member.name}</Link></li>
                                                                ))}
                                                            </ul>
                                                        </>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={12} className="mt-2">
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveRelationship(rel)}
                                                >
                                                    Remove
                                                </Button>
                                            </Col>
                                        </>
                                    )}
                                </>
                            )}
                        </Row>
                    </ListGroup.Item>
                ))}
            </ListGroup>

            {/* add new relationship form */}
            <div className="border-top pt-3 mb-3">
                <h6>Add New Relationship</h6>
                <Row className="align-items-end">
                    <Col md={3}>
                        <Form.Label>Role:</Form.Label>
                        <Form.Control
                            as="select"
                            value={newRelation.relationshipType || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNewRelation({
                                    ...newRelation,
                                    relationshipType: val,
                                    // reset others
                                    partnershipId: '',
                                    targetCharacterId: '',
                                });
                            }}
                        >
                            <option value="">Select role</option>
                            {ROLE_CODES.map((code) => (
                                <option key={code} value={code}>
                                    {code}
                                </option>
                            ))}
                        </Form.Control>
                    </Col>
                    {(newRelation.relationshipType === 'MEMBER') && (
                        <Col md={4}>
                            <Form.Label>Partnership</Form.Label>
                            <Typeahead
                                id="partnership-typeahead"
                                // provide a safe labelKey to handle string options or
                                // custom/new option objects that may not have a
                                // `name` property.  The runtime error occurred when
                                // an option lacked a valid label.
                                labelKey={(option: any) => {
                                    if (typeof option === 'string') return option;
                                    if (option && typeof option === 'object') {
                                        if (option.name != null) return option.name;
                                        if (option.label != null) return option.label;
                                    }
                                    return '';
                                }}
                                allowNew
                                newSelectionPrefix="Create: "
                                options={partnerships
                                    .filter(p => p.name && p.name.trim() !== '')
                                    .map(p => ({ id: p.id, name: p.name }))}
                                placeholder="Select or type a group..."
                                selected={(() => {
                                    if (!newRelation.partnershipId) return [];
                                    const existing = partnerships.find(p => p.id === newRelation.partnershipId);
                                    if (existing) return [{ id: existing.id, name: existing.name }];
                                    // entered free-form name (possibly a plain string)
                                    return [{ id: newRelation.partnershipId, name: newRelation.partnershipName || newRelation.partnershipId }];
                                })()}
                                onChange={(selected: any[]) => {
                                    if (!selected || selected.length === 0) {
                                        setNewRelation({ ...newRelation, partnershipId: '', partnershipName: '' });
                                        return;
                                    }
                                    const sel = selected[0] as any;
                                    if (sel && sel.customOption) {
                                        // custom/new option: the library sometimes gives us
                                        // an object with only `label` (e.g. "Create: magi").
                                        // Avoid storing the whole object as the id/name
                                        // (that was causing our labelKey to later receive
                                        // a non-string and trigger the invariant).
                                        let name: string;
                                        if (typeof sel === 'string') {
                                            name = sel;
                                        } else if (sel.name && typeof sel.name === 'string') {
                                            name = sel.name;
                                        } else if (sel.label && typeof sel.label === 'string') {
                                            // strip the "Create: " prefix if present
                                            name = sel.label.replace(/^Create:\s*/, '');
                                        } else {
                                            // ultimate fallback – convert to string
                                            name = String(sel);
                                        }
                                        setNewRelation({ ...newRelation, partnershipId: name, partnershipName: name });
                                    } else if (sel && typeof sel === 'object') {
                                        setNewRelation({ ...newRelation, partnershipId: sel.id, partnershipName: sel.name });
                                    } else {
                                        // fallback if the selected value is just a string
                                        setNewRelation({ ...newRelation, partnershipId: sel, partnershipName: sel });
                                    }
                                }}
                            />
                        </Col>
                    )}
                    {(newRelation.relationshipType === 'PARENT') && (
                        <>
                            <Col md={4}>
                                <Form.Label>Union</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={newRelation.partnershipId || ''}
                                    onChange={(e) =>
                                        setNewRelation({ ...newRelation, partnershipId: e.target.value })
                                    }
                                >
                                    <option value="">Select union</option>
                                    {myMatePartnerships.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.label}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Col>
                            <Col md={3}>
                                <Form.Label>Child</Form.Label>
                                <Typeahead
                                    id="child-typeahead"
                                    labelKey="name"
                                    options={availableCharacters}
                                    placeholder="Select child"
                                    selected={newRelation.targetCharacterId ? availableCharacters.filter(c => c.id === newRelation.targetCharacterId) : []}
                                    onChange={(selected: any[]) => {
                                        if (selected.length > 0) {
                                            setNewRelation({ ...newRelation, targetCharacterId: String(selected[0].id) });
                                        } else {
                                            setNewRelation({ ...newRelation, targetCharacterId: '' });
                                        }
                                    }}
                                />
                            </Col>
                        </>
                    )}
                    {newRelation.relationshipType && newRelation.relationshipType !== 'MEMBER' && newRelation.relationshipType !== 'PARENT' && (
                        <Col md={4}>
                            <Form.Label>Character</Form.Label>
                            <Typeahead
                                id="character-typeahead"
                                labelKey="name"
                                options={availableCharacters}
                                placeholder="Select character"
                                selected={newRelation.targetCharacterId ? availableCharacters.filter(c => c.id === newRelation.targetCharacterId) : []}
                                onChange={(selected: any[]) => {
                                    if (selected.length > 0) {
                                        setNewRelation({ ...newRelation, targetCharacterId: String(selected[0].id) });
                                    } else {
                                        setNewRelation({ ...newRelation, targetCharacterId: '' });
                                    }
                                }}
                            />
                        </Col>
                    )}
                    <Col md={2}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddRelationship}
                            disabled={
                                !newRelation.relationshipType ||
                                // member or parent need a partnership/union selected
                                ((newRelation.relationshipType === 'MEMBER' || newRelation.relationshipType === 'PARENT') && !newRelation.partnershipId) ||
                                // parent also needs a child selected
                                (newRelation.relationshipType === 'PARENT' && !newRelation.targetCharacterId) ||
                                // other roles (not member/parent) need a character
                                (!['MEMBER', 'PARENT'].includes(newRelation.relationshipType || '') && !newRelation.targetCharacterId)
                            }
                        >
                            Add
                        </Button>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}