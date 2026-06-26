'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import { ChangeEvent, useEffect, useState } from 'react';
import { useAuth } from "./_components/AuthContext";
import { Typeahead } from 'react-bootstrap-typeahead';
import "react-bootstrap-typeahead/css/Typeahead.css";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from 'react-bootstrap/Form';
import Row from "react-bootstrap/Row";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import AttributeListEditor from "./_components/AttributeListEditor";
import MarkdownEditor from './_components/MarkdownEditor';
import ChatModal from './_components/ChatModal';
import ErrorModal from './_components/ErrorModal';
import FamilyTree from './_components/FamilyTree';
import ImageGrid from './_components/ImageGrid';
import { CDProps, ReconcileDescriptionModal } from "./_components/ReconcileDescription";
import RelationsListEditor from "./_components/RelationsListEditor";
import { useCharacterEditor } from './_hooks/useCharacterEditor';
import { useCharacterEvents } from './_hooks/useCharacterEvents';
import { useCharacterSelection } from './_hooks/useCharacterSelection';
import { CharacterDataWithoutID } from './types';
import StoryService from './services/StoryService';

const CharacterList = () => {
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [eventReconcileMessage, setReconcileEventMessage] = useState<CDProps | null>(null);
    const [showReconcileEventModal, setReconcileShowEventModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [relationsVersion, setRelationsVersion] = useState(0);
    const { isAuthenticated, loading, logout } = useAuth();

    const [stories, setStories] = useState<{ uuid: number; name: string }[]>([]);
    const [selectedStoryUuid, setSelectedStoryUuid] = useState<number | null>(null);

    useEffect(() => {
        if (isAuthenticated && !loading) {
            StoryService.get_story_names()
                .then((response) => {
                    setStories(response.data);
                    if (response.data && response.data.length > 0) {
                        setSelectedStoryUuid(response.data[0].uuid);
                    }
                })
                .catch((error) => {
                    console.error("Failed to fetch story names", error);
                });
        }
    }, [isAuthenticated, loading]);

    const { characterIDs, selectedCharacterId, handleCharacterChange, refreshCharacterIDs } = useCharacterSelection(selectedStoryUuid, isAuthenticated, loading);
    const {
        editorState,
        dispatch,
        fetchCharacter,
        saveCharacter,
        deleteCharacter,
        updateField,
        updateArrayField,
        resetCharacter,
        setError,
    } = useCharacterEditor(selectedStoryUuid);

    useCharacterEvents({
        selectedCharacterId: editorState.selectedCharacterId,
        isAuthenticated,
        dispatch,
        onReconcileEvent: (message) => {
            setReconcileEventMessage(message);
            setReconcileShowEventModal(true);
        },
    });

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            return;
        }

        if (!isAuthenticated) {
            return;
        }

        if (selectedCharacterId) {
            void fetchCharacter(selectedCharacterId);
        } else {
            resetCharacter();
        }
    }, [selectedCharacterId, isAuthenticated, loading, fetchCharacter, resetCharacter]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value } = event.target;
        const parsedValue = name === 'sex' ? parseInt(value, 10) : value;
        updateField(name as keyof CharacterDataWithoutID, parsedValue as string | number);
    };

    const handleAttributesChange = (newAttributes: string[]) => {
        updateArrayField('roleplaying', newAttributes);
    };

    const handleSave = async () => {
        try {
            const savedId = await saveCharacter();
            if (savedId) {
                refreshCharacterIDs();
                handleCharacterChange(savedId.toString());
            }
        } catch (error) {
            setError('Failed to save character.');
            setShowErrorModal(true);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCharacter();
            await refreshCharacterIDs();
            handleCharacterChange(null);
        } catch (error) {
            setError('Failed to delete character.');
            setShowErrorModal(true);
        }
    };

    const handleCreateNew = () => {
        resetCharacter();
        handleCharacterChange(null);
    };

    if (loading) {
        return <div>Checking authentication...</div>;
    }

    if (!isAuthenticated) {
        return <div>Redirecting to login...</div>;
    }

    return (
        <div>
            <ChatModal show={showChatModal} onHide={() => setShowChatModal(false)} />

            <ErrorModal
                show={showErrorModal}
                onHide={() => setShowErrorModal(false)}
                error={editorState.error}
            />
            <ReconcileDescriptionModal
                show={showReconcileEventModal}
                onHide={() => setReconcileShowEventModal(false)}
                data={eventReconcileMessage}
                dispatch={dispatch}
            />
            <Form>
                <Row>
                    <Col xs="auto">
                        <Form.Select
                            value={selectedStoryUuid ?? ''}
                            onChange={(e) => {
                                const newUuid = parseInt(e.target.value, 10);
                                setSelectedStoryUuid(isNaN(newUuid) ? null : newUuid);
                                handleCharacterChange(null);
                            }}
                        >
                            <option value="" disabled>Select a story...</option>
                            {stories.map((story) => (
                                <option key={story.uuid} value={story.uuid}>
                                    {story.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs="auto">
                        <Typeahead
                            id="character-combo"
                            placeholder="Choose or type..."
                            labelKey="label"
                            inputProps={{ type: "text" }}
                            selected={
                                editorState.selectedCharacterId && editorState.character
                                    ? [{ id: editorState.selectedCharacterId.toString(), label: editorState.character.name || '' }]
                                    : []
                            }
                            clearButton={true}
                            onChange={(selected) => {
                                const item = selected[0] as { id: string; label: string } | undefined;
                                if (item) {
                                    handleCharacterChange(item.id);
                                } else {
                                    // User cleared the selection
                                    handleCharacterChange(null);
                                }
                            }}
                            options={characterIDs.map((i) => ({ id: i.id.toString(), label: i.name }))}
                        />
                    </Col>
                    <Col>
                        <Button variant="primary" onClick={handleCreateNew}>+</Button>
                        <Button
                            className="ms-2"
                            variant="outline-primary"
                            onClick={() => setShowChatModal(true)}
                        >
                            Chat
                        </Button>
                        <Button
                            className="ms-2"
                            variant="outline-danger"
                            onClick={logout}
                        >
                            Logout
                        </Button>
                    </Col>
                </Row>
            </Form>

            <div>
                {editorState.character ? (
                    <div className="flex flex-row gap-6">
                        {/* Left column */}
                        <div className="w-1/3 flex flex-col gap-4">
                            {/* Images section */}
                            <div className="max-h-[400px] p-2 flex flex-col items-center">
                                <ImageGrid
                                    images={editorState.character.images ?? []}
                                    dispatch={dispatch}
                                    characterId={editorState.selectedCharacterId}
                                />
                            </div>
                            {/* Family Tree section */}
                            <div className="h-[400px]">
                                {editorState.selectedCharacterId && (
                                    <FamilyTree
                                        characterId={editorState.selectedCharacterId}
                                        onNodeClick={handleCharacterChange}
                                        refreshTrigger={relationsVersion}
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
                                                value={editorState.character.name}
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
                                                value={editorState.character.sex}
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
                                        value={editorState.character.appearance ?? ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter appearance"
                                        rows={4}
                                    />
                                </Form.Group>


                                <div>
                                    <label>Attributes:</label>
                                    <AttributeListEditor
                                        attributes={editorState.character.roleplaying ?? []}
                                        onChange={handleAttributesChange}
                                    />
                                </div>

                                <Tabs defaultActiveKey="background" id="character-details-tabs" fill>
                                    <Tab eventKey="background" title="Background">
                                        <div className="mt-2 bg-white rounded">
                                            <MarkdownEditor
                                                key={editorState.selectedCharacterId ?? 'new'}
                                                value={editorState.character.background ?? ''}
                                                onChange={(val) => updateField('background', val)}
                                            />
                                        </div>
                                    </Tab>
                                    <Tab eventKey="key-relations" title="Key Relations" id="keyrelations-tab">
                                        {editorState.selectedCharacterId && (
                                            <RelationsListEditor
                                                characterId={editorState.selectedCharacterId}
                                                availableCharacters={characterIDs.filter(c => c.id !== editorState.selectedCharacterId)}
                                                onSave={() => setRelationsVersion(prev => prev + 1)}
                                            />
                                        )}

                                    </Tab>
                                </Tabs>

                                <div className="flex justify-between mt-2">
                                    <Button
                                        variant="primary"
                                        onClick={handleSave}>
                                        Save
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleDelete}
                                        disabled={!editorState.selectedCharacterId}>
                                        Delete
                                    </Button>
                                </div>
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