'use client';

import React, { useState, useEffect } from "react";
import CharacterDataService from '../_lib/CharacterService'

interface CharacterData {
    id: number;
    name: string;
    appearance: string;
    sex: Number;
    images: string[];
    description: string;
    rolesplaying: string[];
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
    );
};

export default CharacterList;