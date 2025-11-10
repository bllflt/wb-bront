import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import Image from 'react-bootstrap/Image';


interface ImageGridProps {
    images: string[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {

    return (
        <Carousel wrap={false} interval={null}>
            {images.map((img) => (
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
    );
}
export default ImageGrid;
