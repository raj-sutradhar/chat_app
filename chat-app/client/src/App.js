

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Join from './Join';
import './App.css';

const SOCKET_SERVER_URL = "http://192.168.1.6:5000";

function App() {
    const [socket, setSocket] = useState(null);
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('');
    const [connected, setConnected] = useState(false);
    const [chatStarted, setChatStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState('Connecting...');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setStatus('Waiting to join a room...');
        });

        newSocket.on('joinedRoom', ({ room, users }) => {
            console.log(`Joined room: ${room} with ${users} user(s)`);
            setStatus('Waiting for a partner...');
        });

        newSocket.on('userJoined', ({ username }) => {
            console.log(`${username} has joined the room.`);
            setStatus('Partner joined. Waiting for chat to start...');
        });

        newSocket.on('chatStarted', () => {
            console.log('Chat started');
            setChatStarted(true);
            setStatus('Connected. You can start chatting!');
        });

        newSocket.on('receiveMessage', ({ username, text, time }) => {
            setMessages(prev => [...prev, { sender: username, text, time }]);
        });

        newSocket.on('userLeft', ({ username }) => {
            setStatus(`${username} has left the chat.`);
        });

        newSocket.on('partnerDisconnected', () => {
            setStatus('Partner disconnected. Finding a new partner...');
            setChatStarted(false);
            setMessages([]);
            
        });

        newSocket.on('readyToJoin', () => {
            setChatStarted(false);
            setStatus('Ready to join a new room.');
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleJoin = ({ username, room }) => {
        setUsername(username);
        setRoom(room);
        socket.emit('joinRoom', { username, room });
        setConnected(true);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() === '' || !chatStarted) return;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { sender: 'You', text: input, time: timestamp }]);
        socket.emit('sendMessage', input);
        setInput('');
    };

    const findNewPartner = () => {
        if (socket && chatStarted) {
          socket.emit('leaveRoom');
          socket.emit('findNewPartner');
          setChatStarted(false);
          setStatus('Finding a new partner...');
          setMessages([]);
          setUsername(''); 
          setRoom('');
          setConnected(false); 
          setStatus('You have left the chat. Waiting for a new partner...'); 
        }
      };
    //   useEffect(() => {
    //     socket.on('partnerLeft', () => {
    //         setStatus('Your partner has left the chat.');
    //     });
    // }, [socket]);

    return (
        <div className="App">
            {!connected ? (
                <Join handleJoin={handleJoin} />
            ) : (
                <div className="chat-container">
                    <div className="status">{status}</div>
                    {chatStarted && (
                        <div className="chat-box">
                            <div className="messages">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`message ${msg.sender === 'You' ? 'you' : 'partner'}`}
                                    >
                                        <div className="message-content">
                                            <span className="message-sender">{msg.sender}:</span> {msg.text}
                                        </div>
                                        <div className="message-time">
                                            {msg.time}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form className="message-form" onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    required
                                />
                                <button type="submit">➤</button> {}
                            </form>
                            <button className="new-partner-btn" onClick={findNewPartner}>
                                Find New Partner
                            </button>
                        </div>
                    )}
                    {!chatStarted && connected && (
                        <div className="waiting">
                            <p>Waiting for a partner to join...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
