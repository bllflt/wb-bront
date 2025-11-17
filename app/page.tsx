'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { ChangeEvent, useEffect, useState, useReducer } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ErrorModal from './_components/ErrorModal';
import ImageGrid from './_components/ImageGrid';
import AttributeListEditor from "./_components/AttributeListEditor";
import FamilyTree from './_components/FamilyTree';
import RelationsListEditor from "./_components/RelationsListEditor";
import CharacterDataService from './services/CharacterService';
import { CharacterDataWithoutID, CharacterRelations, CharacterID } from './types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Form from "react-bootstrap/Form";


export type CharacterImage = string;

interface CharacterState {
    images: CharacterImage[];
}

export type CharacterAction =
    | { type: 'UPDATE_IMAGES'; payload: CharacterImage[] }
    | { type: 'ADD_IMAGE'; payload: CharacterImage }
    | { type: 'REMOVE_IMAGE'; payload: CharacterImage }; // Payload is the image URL to remove

function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
    switch (action.type) {
        case 'UPDATE_IMAGES':
            return { ...state, images: action.payload };
        case 'ADD_IMAGE':
            return { ...state, images: [...state.images, action.payload] };
        case 'REMOVE_IMAGE':
            return { ...state, images: state.images.filter(image => image !== action.payload) };
        default:
            return state; // Should not happen with exhaustive type checking, but good practice
    }
}

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
    const [characterState, dispatch] = useReducer(characterReducer, {
        images: [],
    });
    const [currentPictureID, setCurrentPictureID] = useState<number>(0);

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

        CharacterDataService.getCharacterConnections(currentCharacterID, 0)
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
        Promise.all([CharacterDataService.get(id), CharacterDataService.getCharacterConnections(id, 0)])
            .then(([charResponse, twistResponse]) => {
                const { id: charId, images, ...restOfCharData } = charResponse.data;
                setCurrentCharacterID(charId);
                setCurrentCharacter(restOfCharData);
                dispatch({ type: 'UPDATE_IMAGES', payload: images || [] }); // Dispatch images to reducer
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
        if (!currentCharacterID || !currentCharacter) return;

        const characterDataWithImages = { ...currentCharacter, images: characterState.images };

        CharacterDataService.update(currentCharacterID, characterDataWithImages)
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
                const { id, images, ...restOfResponseData } = response.data; // Destructure images from response
                setCurrentCharacter(restOfResponseData);
                dispatch({ type: 'UPDATE_IMAGES', payload: images || [] });
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
                    <Col xs="auto">
                        <Form.Select
                            data-width="auto"
                            value={currentCharacterID || "none"}
                            style={{ width: 'fit-content' }}
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
                                    name: "",
                                    appearance: "",
                                    background: "",
                                    sex: 9,
                                } as CharacterDataWithoutID);
                                dispatch({ type: 'UPDATE_IMAGES', payload: [] }); // Clear images for new character
                            }}
                        >+</Button>
                    </Col>
                </Row>
            </Form>


            <div>
                {currentCharacter ? (
                    <div className="flex flex-row gap-6">
                        {/* Left column */}
                        <div className="w-1/3 flex flex-col gap-4">
                            {/* Images section */}
                            <div className="max-h-[400px] overflow-y-auto rounded p-2 flex flex-col items-center">
                                {characterState.images && (
                                    <ImageGrid images={characterState.images} dispatch={dispatch} />
                                )}
                            </div>
                            {/* Family Tree section */}
                            <div className="h-[400px]">
                                {currentCharacterID && (
                                    <FamilyTree
                                        characterId={currentCharacterID}
                                        onNodeClick={handleCharacterChange}
                                    />
                                )}
                            </div>
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
                                                style={{ width: 'fit-content' }}
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