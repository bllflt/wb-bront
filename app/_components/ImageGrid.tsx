import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Carousel from 'react-bootstrap/Carousel';
import AiService from '../services/AiService';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { CharacterEditorAction } from '../_hooks/useCharacterEditor';
import { CharacterImage } from '../types';

interface ImageGridProps {
    images: CharacterImage[];
    dispatch: React.Dispatch<CharacterEditorAction>;
    characterId: number | null;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, dispatch, characterId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSelect = (selectedIndex: number) => {
        setActiveIndex(selectedIndex);
    };

    // Keep the carousel index valid when the image list changes.
    useEffect(() => {
        if (images.length === 0) {
            setActiveIndex(0);
        } else if (activeIndex >= images.length) {
            setActiveIndex(images.length - 1);
        }
    }, [images, activeIndex]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !characterId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('character_id', characterId.toString());

        try {
            // Adjust the URL endpoint based on your backend API structure
            const response = await fetch(`http://localhost:2000/characters/upload-image`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                // Assuming backend returns { filename: "..." }
                if (data.filename) {
                    // dispatch({ type: 'ADD_IMAGE', payload: data.filename });
                }
                setShowUploadModal(false);
                setSelectedFile(null);
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error during upload:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerate = async () => {
        if (!characterId || isGenerating) return;

        setIsGenerating(true);
        try {
            const response = await fetch(`http://localhost:2000/characters/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ character_id: characterId.toString() })
            })
            if (!response.ok) {
                console.error('Failed to trigger image generation');
            }
        }
        catch (error) {
            console.error('Error during generation:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Container>
            <Row>
                <Col>
                    <Carousel activeIndex={activeIndex} onSelect={handleSelect}
                        controls={true}
                        variant={"dark"}
                        wrap={false}
                        slide={false}
                        interval={null}>
                        {images.map((img: CharacterImage) => (
                            <Carousel.Item key={img}>
                                <Image
                                    src={`http://localhost:2000/images/`.concat(img)}
                                    thumbnail={true}
                                    style={{
                                        maxHeight: '380px',
                                        width: 'auto',
                                        margin: '0 auto'
                                    }}
                                />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </Col>

                <Col>
                    <ButtonGroup vertical >
                        <Button onClick={() => {
                            if (images.length > 0) {
                                const imageToRemove = images[activeIndex];
                                dispatch({ type: 'REMOVE_IMAGE', payload: imageToRemove });
                                // If the last image was deleted, adjust the active index.
                                if (activeIndex >= images.length - 1) {
                                    setActiveIndex(Math.max(0, images.length - 2));
                                }
                            }
                        }}
                            disabled={images.length === 0}>Delete</Button>
                        <Button
                            onClick={() => {
                                const imageToCaption = images[activeIndex];
                                AiService.createWork({ 'image': imageToCaption });
                            }}
                            disabled={images.length === 0}
                        >Check</Button>
                        <Button onClick={() => setShowUploadModal(true)}>Upload</Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={!characterId || isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>

            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload Image</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpload}>
                        {/* Hidden input for character_id as requested */}
                        <input
                            type="hidden"
                            name="character_id"
                            value={characterId ?? ''}
                        />

                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label>Select Image File</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={!selectedFile || isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>

    );
}
export default ImageGrid;
