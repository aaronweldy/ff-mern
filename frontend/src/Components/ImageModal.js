import {
  Row, Button, Modal, ModalBody, Image, Form, Col,
} from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import React, { useState, useCallback, useEffect } from 'react';

const ImageModal = (props) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [name, setName] = useState(props.name);
  useEffect(() => {
    setName(props.name);
  }, [props]);
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
        <Modal.Title>Set Team Info</Modal.Title>
      </Modal.Header>
      <ModalBody>
        {name && 
        <Row>
          <Col>
            <Form.Label>Team Name</Form.Label>
            <Form.Control type="text" placeholder="Set Team Name" value={name} onChange={(e) => setName(e.target.value)}/>
          </Col>
        </Row>
        }
        <Row className="mb-3 mt-3">
          <Col>
          <Form.Label>Team Logo</Form.Label>
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              Select or drop image here
            </div>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Image className="image-fit" src={imageUrl} />
        </Row>
      </ModalBody>
      <Modal.Footer className="d-flex justify-content-start">
        <Button
          variant="success"
          onClick={() => props.handleInfoSubmission(imageUrl, name)}
        >
          Submit Info
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageModal;
