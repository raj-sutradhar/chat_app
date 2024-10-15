

import React from 'react';
import './VideoCall.css';

function VideoCall({ peer }) {
    const endCall = () => {
        if (peer) {
            peer.destroy();
           
        }
    };

    return (
        <div className="video-call-controls">
            <button className="end-call-btn" onClick={endCall}>
                End Call
            </button>
        </div>
    );
}

export default VideoCall;
