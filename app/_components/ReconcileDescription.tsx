'use client'

import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from "react-bootstrap/Form";
import { CharacterAction } from '../page';


export interface CDProps {
    new_description: string;
    explanation: string;
}

export interface ReconcileDescriptionModalProps {
    show: boolean;
    onHide: () => void;
    dispatch: React.Dispatch<CharacterAction>;
    data: CDProps | null;
};

export const ReconcileDescriptionModal: React.FC<ReconcileDescriptionModalProps> = ({ show, onHide, data, dispatch }) => {
    const [newDescription, setNewDescription] = useState('');
    const [parsedData, setParsedData] = useState<CDProps | null>(null);

    useEffect(() => {
        if (show && data) {
            // It seems 'data' might be a JSON string. Let's parse it.
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            setParsedData(parsed);
            setNewDescription(parsed?.new_description ?? '');
        }
    }, [show, data]);
    const handleSave = () => {
        dispatch({ type: 'UPDATE_STRING', payload: ['appearance', newDescription] });
        onHide();
    };
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="new_description">
                        <Form.Label>New Description:</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                        >
                        </Form.Control>
                    </Form.Group>
                    <Form.Group controlId="explanation">
                        <Form.Label>
                            Explanation:
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            readOnly={true}
                            value={parsedData?.explanation ?? ''}
                        ></Form.Control>
                    </Form.Group>
                    <Button onClick={handleSave}
                    >Save</Button>




                </Form>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
