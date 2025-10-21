'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import AttributeListEditor from "./_components/AttributeListEditor";
import RelationsListEditor from "./_components/RelathionsListEditor";
import FamilyTree from './_components/FamilyTree';
import CharacterDataService from './_lib/CharacterService';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

interface CharacterData {
    id: number;
    name: string;
    appearance: string;
    sex: number;
    images: string[];
    roleplaying: string[];
    background: string;
}
interface CharacterDataWithoutID extends Omit<CharacterData, 'id'> { };

interface CharacterUnions {
    value: number;
    label: string;
}

interface CharacterRelations {
    type: number;
    source: number;
    target: number;
}

const CharacterList = () => {
    const [characterIDs, setCharacterIDs] = useState<CharacterData[]>([]);
    const [currentCharacter, setCurrentCharacter] = useState<CharacterDataWithoutID | null>(null);
    const [currentCharacterID, setCurrentCharacterID] = useState<number | null>(null);
    const [relations, setRelations] = useState<CharacterRelations[]>([]);
    const [currentUnions, setUnions] = useState<CharacterUnions[]>([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        retrieveCharacterIDs();
    }, []);

    const retrieveCharacterIDs = () => {
        CharacterDataService.getAllIDs()
            .then(response => {
                setCharacterIDs(response.data);
            })
            .catch(e => {
                console.log(e);
            });
    }


    const expandrelations = (list: any, currentCharacterID: number) => {
        const charUnion = [];
        const charRelations = [];
        for (var i = 0; i < list.length; ++i) {
            /* Marriage */
            console.log(list[i]);
            console.log(currentCharacterID);
            if ([1, 2, 3, 4, 5, 6].includes(list[i].type)) {
                charUnion.push({ 'value': list[i].id, 'label': [list[i].participants.map(p => p.name)].filter(Boolean).join(', ') });

                if (list[i].participants.map(p => p.id).includes(currentCharacterID)) {
                    for (var j = 0; j < list[i].participants.length; ++j) {
                        if (list[i].participants[j].id != currentCharacterID) {
                            charRelations.push({ 'type': list[i].type, 'source': list[i].id, 'target': list[i].participants[j].id })
                        }
                    }
                }
                for (var j = 0; j < list[i].children.length; ++j) {
                    charRelations.push({ 'type': 7, 'source': list[i].id, 'target': list[i].children[j].id });
                }
            }

        }
        return { 'unions': charUnion, 'relations': charRelations };
    }




    const handleCharacterChange = (id: string) => {
        Promise.all([CharacterDataService.get(id), CharacterDataService.getCharacterConnections(id)])
            .then(([charResponse, twistResponse]) => {
                const { id: charId, ...restOfCharData } = charResponse.data;
                setCurrentCharacterID(charId);
                setCurrentCharacter(restOfCharData);

                const expanded = expandrelations(twistResponse.data, Number(id));

                setUnions(expanded?.unions || []);
                setRelations(expanded?.relations || []);
            })
            .catch(e => {
                console.log(e);
                // It's good practice to handle potential UI state in case of an error
                setMessage("Failed to load character data.");
            });
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = event.target;
        setCurrentCharacter({ ...currentCharacter, [name]: value } as CharacterDataWithoutID);
    };


    const handleAttributesChange = (newAttributes: string[]) => {
        setCurrentCharacter({ ...currentCharacter, roleplaying: newAttributes } as CharacterDataWithoutID);
    };

    const handleRelationChange = (newRelations: string[]) => {
        setRelations(newRelations);
        console.log(relations);
    };


    const updateCharacter = () => {
        CharacterDataService.update(currentCharacterID, currentCharacter)
            .then(response => {
                setMessage("The character was updated successfully!");
            })
            .catch(e => {
                console.log(e);
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
                console.log(e);
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
                console.log(e);
            });
    };


    return (
        <div>
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
                            onClick={() => setCurrentCharacter({
                                roleplaying: [],
                                images: [],
                                name: "",
                                appearance: "",
                                background: "",
                                sex: 9,
                            } as CharacterDataWithoutID)}
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
                                <FamilyTree characterId={currentCharacterID} />
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
                                        <RelationsListEditor
                                            relations={relations}
                                            unions={currentUnions}
                                            onChange={handleRelationChange}
                                            characterIDs={characterIDs}
                                        />

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
                                <p>{message}</p>
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