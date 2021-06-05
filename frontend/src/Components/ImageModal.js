import { Row, Button, Modal, ModalBody, Image } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import React, { useState, useCallback } from "react";

const ImageModal = (props) => {
  const [imageUrl, setImageUrl] = useState(null);
  const onDrop = useCallback((acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = (url) => {
      setImageUrl(url.target.result);
    };
    reader.readAsDataURL(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  return (
    <Modal show={props.showImage} onHide={props.handleHide}>
      <Modal.Header>
        <Modal.Title>Set User Image</Modal.Title>
      </Modal.Header>
      <ModalBody>
        <Row className="mb-3">
          <div {...getRootProps({ className: "dropzone" })}>
            <input {...getInputProps()} />
            Select or drop image here
          </div>
        </Row>
        <Row className="justify-content-center">
          <Image className="image-fit" src={imageUrl}></Image>
        </Row>
      </ModalBody>
      <Modal.Footer className="d-flex justify-content-start">
        <Button
          variant="success"
          onClick={() => props.handleImageSubmission(imageUrl)}
        >
          Submit User Image
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageModal;
