

import React, { useState } from 'react';
import './Join.css';

function Join({ handleJoin }) {
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('');

    const onSubmit = (e) => {
        e.preventDefault();
        if (username.trim() && room.trim()) {
            handleJoin({ username, room });
        }
    };

    return (
        <div className="join-container">
            <h2>Join a Chat Room</h2>
            <form onSubmit={onSubmit} className="join-form">
                <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Enter room number"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    required
                />
                <button type="submit">Join</button>
            </form>
        </div>
    );
}

export default Join;
