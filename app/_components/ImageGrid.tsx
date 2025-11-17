import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Carousel from 'react-bootstrap/Carousel';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { CharacterAction, CharacterImage } from '../page'; // Assuming type export from page.tsx


interface ImageGridProps {
    images: CharacterImage[];
    dispatch: React.Dispatch<CharacterAction>;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, dispatch }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleSelect = (selectedIndex: number) => {
        setActiveIndex(selectedIndex);
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
                            }
                        }}
                            disabled={images.length === 0}>Delete</Button>
                        <Button
                            disabled={images.length === 0}
                        >Check</Button>
                        <Button>Upload</Button>
                        <Button>Generate</Button>

                    </ButtonGroup>
                </Col>
            </Row>
        </Container>

    );
}
export default ImageGrid;
