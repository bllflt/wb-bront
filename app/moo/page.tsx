'use client';

import React, { useState, useEffect } from "react";
import CharacterDataService from '../_lib/CharacterService'

interface CharacterData {
    id: number;
    name: string;
    appearance: string;
    sex: Number;
    images: string[];
    roleplaying: string[];
    background: string;
}


const CharacterList = () => {
    const [characters, setCharacters] = useState<CharacterData[]>([]);
    const [currentCharacter, setCurrentCharacter] = useState<CharacterData | null>(null);


    useEffect(() => {
        retrieveCharacters();
    }, []);

    const retrieveCharacters = () => {
        CharacterDataService.getAll()
            .then(response => {
                setCharacters(response.data);
                console.log(response.data);
            })
            .catch(e => {
                console.log(e);
            });

    }

    const handleChange = (name: string) => {
        const item: any = characters.find((i) => i.name === name);
        setCurrentCharacter(item);
    }


    return (
        <div>
            <div>
                <select
                    value={currentCharacter && currentCharacter.name || "none"}
                    onChange={e => handleChange(e.target.value)}
                >
                    <option value="none" disabled hidden> Select a Character</option>
                    {characters.map((e, key) => {
                        return <option value={e.name} key={key}> {e.name}</option>
                    })}
                </select>
            </div>
            <div>
                {currentCharacter ? (
                    <div>
                        <div style={{ float: 'left' }}>
                            {currentCharacter.images && currentCharacter.images.map((img, idx) => (
                                <img key={idx} src={"http://127.0.0.1:5000/images/".concat(img)} alt={`${currentCharacter.name} image ${idx + 1}`} style={{ maxWidth: '200px', marginRight: '10px' }} />
                            ))}
                        </div>
                        <h2>{currentCharacter.name}</h2>
                        <p>Appearance: {currentCharacter.appearance}</p>

                        <div>
                            <h3>Rolesplaying</h3>
                            <ul className="list-disc list-inside">
                                {currentCharacter.roleplaying && currentCharacter.roleplaying.map((role, idx) => (
                                    <li key={idx}>{role}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p>Background: {currentCharacter.background}</p>
                        </div>
                    </div>
                ) : (<div>Please select a character</div>)}

            </div>
        </div>
    );
};

export default CharacterList;