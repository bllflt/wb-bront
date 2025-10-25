'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ErrorModal from './_components/ErrorModal';
import AttributeListEditor from "./_components/AttributeListEditor";
import FamilyTree from './_components/FamilyTree';
import RelationsListEditor from "./_components/RelathionsListEditor";
import CharacterDataService from './services/CharacterService';
import { CharacterDataWithoutID, CharacterRelations, CharacterID } from './types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Form from "react-bootstrap/Form";

const CharacterList = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [characterIDs, setCharacterIDs] = useState<CharacterID[]>([]);
    const [currentCharacter, setCurrentCharacter] = useState<CharacterDataWithoutID | null>(null);
    const [currentCharacterID, setCurrentCharacterID] = useState<number | null>(null);
    const [connections, setConnections] = useState<any[]>([]);
    const [modifiedRelations, setModifiedRelations] = useState<CharacterRelations[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        retrieveCharacterIDs();

        const charIdFromUrl = searchParams.get('characterId');
        if (charIdFromUrl) {
            if (Number(charIdFromUrl) !== currentCharacterID) {
                fetchCharacterData(charIdFromUrl);
            }
        }
    }, [searchParams]);

    const retrieveCharacterIDs = () => {
        CharacterDataService.getAllIDs()
            .then(response => {
                setCharacterIDs(response.data);
            })
            .catch(e => {
                console.error(e);
                setError("BIG WARNING: Could not connect to the backend. Is the dev server running?");
                setShowErrorModal(true);
            });
    }

    const refreshCharacterData = () => {
        if (!currentCharacterID) return;

        CharacterDataService.getCharacterConnections(currentCharacterID, 1)
            .then(twistResponse => {
                setConnections(twistResponse.data || []);
                setModifiedRelations(null); // Reset modified relations to reflect new server state
            })
            .catch(e => {
                console.error(e);
                setError("Failed to refresh character connections.");
                setShowErrorModal(true);
            });
    };

    const handleCharacterChange = (id: string | null) => {
        const newUrl = id ? `${pathname}?characterId=${id}` : pathname;
        router.push(newUrl);
    };

    const fetchCharacterData = (id: string) => {
        Promise.all([CharacterDataService.get(id), CharacterDataService.getCharacterConnections(id, 1)])
            .then(([charResponse, twistResponse]) => {
                const { id: charId, ...restOfCharData } = charResponse.data;
                setCurrentCharacterID(charId);
                setCurrentCharacter(restOfCharData);
                setConnections(twistResponse.data || []);
                setModifiedRelations(null); // Reset modified relations on character change
            })
            .catch(e => {
                console.error(e);
                setError("Failed to load character data.");
                setShowErrorModal(true);
            });
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = event.target;
        setCurrentCharacter({ ...currentCharacter, [name]: value } as CharacterDataWithoutID);
    };


    const handleAttributesChange = (newAttributes: string[]) => {
        setCurrentCharacter({ ...currentCharacter, roleplaying: newAttributes } as CharacterDataWithoutID);
    };

    const handleRelationChange = (newRelations: CharacterRelations[]) => {
        setModifiedRelations(newRelations);
    };


    const updateCharacter = () => {
        CharacterDataService.update(currentCharacterID, currentCharacter)
            .then(response => { })
            .catch(e => {
                console.error(e);
                setError("Failed to update character.");
                setShowErrorModal(true);
            });
    };

    const createCharacter = () => {
        CharacterDataService.create(currentCharacter)
            .then(response => {
                retrieveCharacterIDs();
                setCurrentCharacterID(response.data.id);
                const { id, ...restOfResponseData } = response.data;
                setCurrentCharacter(restOfResponseData);
            })
            .catch(e => {
                console.error(e);
                setError("Failed to create character.");
                setShowErrorModal(true);
            });
    };

    const deleteCharacter = () => {
        CharacterDataService.remove(currentCharacterID)
            .then(response => {
                retrieveCharacterIDs();
                setCurrentCharacterID(null);
                setCurrentCharacter(null);
            })
            .catch(e => {
                console.error(e);
                setError("Failed to delete character.");
                setShowErrorModal(true);
            });
    };


    return (
        <div>
            <ErrorModal
                show={showErrorModal}
                onHide={() => setShowErrorModal(false)}
                error={error}
            />
            <Form>
                <Row>
                    <Col>
                        <Form.Select
                            data-width="auto"
                            value={currentCharacterID || "none"}
                            onChange={e => handleCharacterChange(e.target.value)}
                        >
                            <option value="none" disabled hidden> Select a Character</option>
                            {characterIDs.map((e) => {
                                return <option value={e.id} key={e.id}> {e.name}</option>
                            })}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Button variant="primary"
                            onClick={() => {
                                setCurrentCharacterID(null);
                                setCurrentCharacter({
                                    roleplaying: [],
                                    images: [],
                                    name: "",
                                    appearance: "",
                                    background: "",
                                    sex: 9,
                                } as CharacterDataWithoutID)
                            }}
                        >+</Button>
                    </Col>
                </Row>
            </Form>


            <div>
                {currentCharacter ? (
                    <div className="flex flex-row gap-6">
                        {/* Images column */}
                        <div className="w-1/3 max-h-[400px] overflow-y-auto rounded p-2  flex flex-col items-center">
                            {currentCharacter.images && currentCharacter.images.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={"http://127.0.0.1:5000/images/".concat(img)}
                                    alt={`${currentCharacter.name} image ${idx + 1}`}
                                    className="mb-2 max-w-full max-h-40 object-contain"
                                />
                            ))}
                            {currentCharacterID && (
                                <FamilyTree
                                    characterId={currentCharacterID}
                                    onNodeClick={handleCharacterChange}
                                />
                            )}
                        </div>
                        {/* Text fields column */}
                        <div className="w-2/3 flex flex-col gap-4">
                            <Form>
                                <Row>
                                    <Col>
                                        <Form.Group controlId="name">
                                            <Form.Label>Name:</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={currentCharacter.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId="sex">
                                            <Form.Label>Sex:</Form.Label>
                                            <Form.Control
                                                as="select"
                                                name="sex"
                                                value={currentCharacter.sex}
                                                onChange={handleInputChange}
                                            >
                                                <option value="none" disabled hidden>Select sex</option>
                                                <option value={0}>Not known</option>
                                                <option value={1}>Male</option>
                                                <option value={2}>Female</option>
                                                <option value={9}>Not applicable</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group controlId="appearance">
                                    <Form.Label>Appearance:</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="appearance"
                                        value={currentCharacter.appearance}
                                        onChange={handleInputChange}
                                        placeholder="Enter appearance"
                                        rows={4}
                                    />
                                </Form.Group>


                                <div>
                                    <label>Attributes:</label>
                                    <AttributeListEditor
                                        attributes={currentCharacter.roleplaying}
                                        onChange={handleAttributesChange}
                                    />
                                </div>

                                <Tabs defaultActiveKey="background" id="character-details-tabs" fill>
                                    <Tab eventKey="background" title="Background">
                                        <Form.Control
                                            as="textarea"
                                            name="background"
                                            value={currentCharacter.background}
                                            onChange={handleInputChange}
                                            placeholder="Enter background"
                                            rows={14}
                                            className="mt-2"
                                        />
                                    </Tab>
                                    <Tab eventKey="key-relations" title="Key Relations" id="keyrelations-tab">
                                        {currentCharacterID && (
                                            <RelationsListEditor
                                                connections={connections}
                                                onChange={handleRelationChange}
                                                modifiedRelations={modifiedRelations}
                                                characterIDs={characterIDs}
                                                characterId={currentCharacterID}
                                                onDataChange={refreshCharacterData}
                                            />
                                        )}

                                    </Tab>
                                </Tabs>

                                <Button
                                    variant="primary"
                                    onClick={createCharacter}>
                                    Create
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={updateCharacter}>
                                    Update
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={deleteCharacter}>
                                    Delete
                                </Button>
                            </Form>

                        </div>
                    </div>
                ) : (
                    <div>Please select a character</div>
                )
                }
            </div >
        </div >
    );

}
export default CharacterList;