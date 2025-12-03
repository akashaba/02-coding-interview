import { useState } from 'react';
import axios from 'axios';
import './Home.css';

const API_URL = 'http://localhost:3001';

function Home() {
  const [roomLink, setRoomLink] = useState('');
  const [copied, setCopied] = useState(false);

  const createRoom = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/create-room`);
      setRoomLink(response.data.link);
      setCopied(false);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="home">
      <div className="home-container">
        <h1 className="title">Online Coding Interview Platform</h1>
        <p className="subtitle">
          Collaborative code editor with real-time synchronization
        </p>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔗</span>
            <span>Share interview links</span>
          </div>
          <div className="feature">
            <span className="feature-icon">👥</span>
            <span>Real-time collaboration</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎨</span>
            <span>Syntax highlighting</span>
          </div>
          <div className="feature">
            <span className="feature-icon">▶️</span>
            <span>Execute code in browser</span>
          </div>
        </div>

        <button className="create-btn" onClick={createRoom}>
          Create Interview Room
        </button>

        {roomLink && (
          <div className="room-link-container">
            <p className="room-link-label">Share this link with candidates:</p>
            <div className="room-link-box">
              <input
                type="text"
                value={roomLink}
                readOnly
                className="room-link-input"
              />
              <button className="copy-btn" onClick={copyToClipboard}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <a href={roomLink} className="join-btn">
              Join Room
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
