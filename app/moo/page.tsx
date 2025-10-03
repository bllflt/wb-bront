'use client';

import React, { useState, useEffect } from "react";
import CharacterDataService from '../_lib/CharacterService'
import AttributeListEditor from "../_components/AttributeListEditor";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import 'bootstrap/dist/css/bootstrap.min.css';
import { create } from "domain";


interface CharacterData {
    id: number;
    name: string;
    appearance: string;
    sex: Number;
    images: string[];
    roleplaying: string[];
    background: string;
}
type CharacterDataWithoutID = Omit<CharacterData, 'id'>;

const CharacterList = () => {
    const [characterIDs, setCharacterIDs] = useState<CharacterData[]>([]);
    const [currentCharacter, setCurrentCharacter] = useState<CharacterData | CharacterDataWithoutID | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        retrieveCharacterIDs();
    }, []);

    const retrieveCharacterIDs = () => {
        CharacterDataService.getAllIDs()
            .then(response => {
                setCharacterIDs(response.data);
                console.log(response.data);
            })
            .catch(e => {
                console.log(e);
            });
    }


    const handleCharacterChange = (id: string) => {
        CharacterDataService.get(id)
            .then(response => {
                setCurrentCharacter(response.data);
                console.log(response.data);
            })
            .catch(e => {
                console.log(e);
            });

    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = event.target;
        setCurrentCharacter({ ...currentCharacter, [name]: value });
    };


    const handleAttributesChange = (newAttributes: string[]) => {
        setCurrentCharacter({ ...currentCharacter, roleplaying: newAttributes });
    };

    const updateCharacter = () => {
        CharacterDataService.update(currentCharacter.id, currentCharacter)
            .then(response => {
                console.log(response.data);
                setMessage("The character was updated successfully!");
            })
            .catch(e => {
                console.log(e);
            });
    };

    const createCharacter = () => {
        CharacterDataService.create(currentCharacter)
            .then(response => {
                console.log(response.data);
                retrieveCharacters();
                retrieveCharacterIDs();
                setCurrentCharacter(response.data);
            })
            .catch(e => {
                console.log(e);
            });
    };

    const deleteCharacter = () => {
        CharacterDataService.remove(currentCharacter.id)
            .then(response => {
                console.log(response.data);
                retrieveCharacters();
                retrieveCharacterIDs();
                setCurrentCharacter(null);
            })
            .catch(e => {
                console.log(e);
            });
    };


    return (
        <div>
            <div>
                <Form.Select
                    value={currentCharacter && currentCharacter.id || "none"}
                    onChange={e => handleCharacterChange(e.target.value)}
                >
                    <option value="none" disabled hidden> Select a Character</option>
                    {characterIDs.map((e) => {
                        return <option value={e.id} key={e.id}> {e.name}</option>
                    })}
                </Form.Select>

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
            </div>
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
                        </div>
                        {/* Text fields column */}
                        <div className="w-2/3 flex flex-col gap-4">
                            <form>
                                <div>
                                    <label>
                                        Name:
                                        <input type="text" name="name"
                                            value={currentCharacter.name}
                                            onChange={handleInputChange}
                                            className="w-full border rounded px-2 py-1" />
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="appearance" className="block font-bold mb-1"> Appearance:</label>
                                    <textarea
                                        name="appearance"
                                        id="appearance"
                                        value={currentCharacter.appearance}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full border rounded px-2 py-1"
                                    />

                                </div>
                                <div>
                                    <label className="block font-bold mb-1">Attributes</label>
                                    <AttributeListEditor
                                        attributes={currentCharacter.roleplaying}
                                        onChange={handleAttributesChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="background" className="block font-bold mb-1">Background</label>
                                    <textarea
                                        name="background"
                                        id="background"
                                        value={currentCharacter.background}
                                        onChange={handleInputChange}
                                        className="w-full border rounded px-2 py-1"
                                        rows={14}
                                    />
                                </div>

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

                            </form>
                        </div>
                    </div>
                ) : (
                    <div>Please select a character</div>
                )
                }
            </div >
        </div >
    );
};

export default CharacterList;