import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import io from 'socket.io-client';
import {
    Container, Row, Col, Form, FormGroup, Label, Input, Button, Alert, ListGroup, ListGroupItem, Card, CardBody, CardHeader, CardFooter,
    Nav, NavItem, NavLink, TabContent, TabPane
} from 'reactstrap';
import classnames from 'classnames';

const socket = io('http://localhost:3000');

//component for creating a room
const CreateRoom = ({ formState, handleInputChange, handleCreateRoom }) => (
    <FormGroup>
        <Label for="roomName">Room Name:</Label>
        <Input
            id="roomName"
            placeholder="Enter room name"
            value={formState.roomName}
            onChange={(e) => handleInputChange('roomName', e.target.value)}
        />
        <Button color="primary" className="mt-2" onClick={handleCreateRoom}>
            Create Room
        </Button>
    </FormGroup>
);

// Component for joining a room
const JoinRoom = ({ formState, handleInputChange, handleJoinRoom }) => (
    <FormGroup>
        <Label for="roomName">Room Name:</Label>
        <Input
            id="roomName"
            placeholder="Enter room name"
            value={formState.roomName}
            onChange={(e) => handleInputChange('roomName', e.target.value)}
        />
        <Button color="secondary" className="mt-2" onClick={handleJoinRoom}>
            Join Room
        </Button>
    </FormGroup>
);

// Component for sending a message in the chat room
const ChatRoom = ({ formState, handleInputChange, handleSendMessage, messages, typing }) => (
    <Card>
        <CardHeader>Chat Room: {formState.roomName}</CardHeader>
        <CardBody>
            <ListGroup>
                {messages.map((msg, index) => (
                    <ListGroupItem key={index}>
                        <strong>{msg.sender}:</strong> {msg.message}
                    </ListGroupItem>
                ))}
            </ListGroup>
            {typing && <div>Someone is typing...</div>}
        </CardBody>
        <CardFooter>
            <Form inline>
                <Input
                    id="message"
                    placeholder="Type a message"
                    value={formState.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                />
                <Button color="success" className="ms-2" onClick={handleSendMessage}>
                    Send
                </Button>
            </Form>
        </CardFooter>
    </Card>
);

// Component for private messaging
const PrivateChat = ({ formState, handleInputChange, handleSendPrivateMessage, recipients }) => (
    <FormGroup>
        <Label for="recipient">Select Recipient:</Label>
        <Input
            type="select"
            id="recipient"
            value={formState.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
        >
            <option value="">Select a recipient</option>
            {recipients.map((recipient, index) => (
                <option key={index} value={recipient.socketId}>
                    {recipient.username}
                </option>
            ))}
        </Input>
        <Label for="privateMessage" className="mt-2">Private Message:</Label>
        <Input
            id="privateMessage"
            placeholder="Type a private message"
            value={formState.privateMessage}
            onChange={(e) => handleInputChange('privateMessage', e.target.value)}
        />
        <Button color="info" className="mt-2" onClick={handleSendPrivateMessage}>
            Send Private Message
        </Button>
    </FormGroup>
);

// Main App Component
const App = () => {
    const [formState, setFormState] = useState({
        username: '',
        roomName: '',
        roomId: '',
        message: '',
        privateMessage: '',
        recipient: ''
    });
    const [messages, setMessages] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [errors, setErrors] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [typing, setTyping] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

    const messageEndRef = useRef(null);

    // Socket events and connection
    useEffect(() => {
        socket.on('newMessage', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
            setTyping(false);
        });

        socket.on('joinedRoom', ({ roomId, roomName, messages }) => {
            setFormState((prev) => ({ ...prev, roomId, roomName }));
            setMessages(messages);
            setErrors('');
            setSuccessMessage(`Joined room ${roomName}`);
        });

        socket.on('roomCreated', ({ roomId, roomName }) => {
            setFormState((prev) => ({ ...prev, roomId, roomName }));
            setSuccessMessage(`Room ${roomName} created successfully!`);
        });

        socket.on('error', (error) => {
            setErrors(error);
            setSuccessMessage('');
        });

        socket.on('typing', ({ sender }) => {
            setTyping(true);
            setTimeout(() => setTyping(false), 2000);
        });

        socket.on('recipients', (recipientsList) => {
            setRecipients(recipientsList); 
        });

        return () => {
            socket.off('newMessage');
            socket.off('joinedRoom');
            socket.off('roomCreated');
            socket.off('typing');
            socket.off('recipients');
            socket.off('error');
        };
    }, []);

    // Helper to update state fields
    const handleInputChange = (field, value) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    // Handle creating room
    const handleCreateRoom = () => {
        if (!formState.roomName) {
            setErrors('Room name is required to create a room.');
            return;
        }
        socket.emit('createRoom', { name: formState.roomName });
    };

    // Handle joining room
    const handleJoinRoom = () => {
        if (!formState.roomName || !formState.username) {
            setErrors('Username and Room name are required to join a room.');
            return;
        }
        socket.emit('joinRoom', { name: formState.roomName, username: formState.username });
    };

    // Handle sending messages
    const handleSendMessage = () => {
        if (!formState.message) {
            setErrors('Message cannot be empty.');
            return;
        }
        socket.emit('sendMessage', {
            roomId: formState.roomId,
            sender: formState.username,
            message: formState.message
        });
        setFormState((prev) => ({ ...prev, message: '' }));
    };

    // Handle sending a private message
const handleSendPrivateMessage = () => {
    if (!formState.privateRecipient || !formState.privateMessage) {
        return;
    }
    socket.emit('sendPrivateMessage', { recipientUsername: formState.privateRecipient, message: formState.privateMessage });
    setFormState({ ...formState, privateMessage: '' });
};

    // Function to toggle tabs
    const toggle = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Nav tabs>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '1' })}
                                onClick={() => { toggle('1'); }}
                            >
                                Create Room
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '2' })}
                                onClick={() => { toggle('2'); }}
                            >
                                Join Room
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '3' })}
                                onClick={() => { toggle('3'); }}
                            >
                                Chat Room
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '4' })}
                                onClick={() => { toggle('4'); }}
                            >
                                Private Chat
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <Card className="mb-4">
                                <CardBody>
                                    <Form>
                                        <FormGroup>
                                            <Label for="username">Username:</Label>
                                            <Input
                                                id="username"
                                                placeholder="Enter your username"
                                                value={formState.username}
                                                onChange={(e) => handleInputChange('username', e.target.value)}
                                            />
                                        </FormGroup>

                                        <CreateRoom
                                            formState={formState}
                                            handleInputChange={handleInputChange}
                                            handleCreateRoom={handleCreateRoom}
                                        />
                                    </Form>
                                </CardBody>
                            </Card>
                        </TabPane>
                        <TabPane tabId="2">
                            <Card className="mb-4">
                                <CardBody>
                                    <Form>
                                        <FormGroup>
                                            <Label for="username">Username:</Label>
                                            <Input
                                                id="username"
                                                placeholder="Enter your username"
                                                value={formState.username}
                                                onChange={(e) => handleInputChange('username', e.target.value)}
                                            />
                                        </FormGroup>

                                        <JoinRoom
                                            formState={formState}
                                            handleInputChange={handleInputChange}
                                            handleJoinRoom={handleJoinRoom}
                                        />
                                    </Form>
                                </CardBody>
                            </Card>
                        </TabPane>
                        <TabPane tabId="3">
                            {formState.roomId && (
                                <ChatRoom
                                    formState={formState}
                                    handleInputChange={handleInputChange}
                                    handleSendMessage={handleSendMessage}
                                    messages={messages}
                                    typing={typing}
                                />
                            )}
                        </TabPane>
                        <TabPane tabId="4">
                            <PrivateChat
                                formState={formState}
                                handleInputChange={handleInputChange}
                                handleSendPrivateMessage={handleSendPrivateMessage}
                                recipients={recipients}
                            />
                        </TabPane>
                    </TabContent>

                    {/* Display Alerts */}
                    {errors && <Alert color="danger">{errors}</Alert>}
                    {successMessage && <Alert color="success">{successMessage}</Alert>}
                </Col>
            </Row>
        </Container>
    );
};

export default App;
