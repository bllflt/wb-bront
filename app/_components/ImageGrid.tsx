import React, { useState, ChangeEvent, FormEvent } from 'react';
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
import { CharacterAction, CharacterImage } from '../page';


interface ImageGridProps {
    images: CharacterImage[];
    dispatch: React.Dispatch<CharacterAction>;
    characterId: number | null;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, dispatch, characterId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSelect = (selectedIndex: number) => {
        setActiveIndex(selectedIndex);
    };

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
            const response = await fetch(`http://127.0.0.1:5000/characters/upload-image`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                // Assuming backend returns { filename: "..." }
                if (data.filename) {
                    dispatch({ type: 'ADD_IMAGE', payload: data.filename });
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

    return (
        <Container>
            <Row>
                <Col>
                    <Carousel activeIndex={activeIndex} onSelect={handleSelect}
                        wrap={false}
                        slide={false}
                        interval={null}>
                        {images.map((img: CharacterImage) => (
                            <Carousel.Item key={img}>
                                <Image
                                    src={`http://127.0.0.1:5000/images/`.concat(img)}
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
                        <Button>Generate</Button>

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
