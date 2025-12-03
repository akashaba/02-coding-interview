import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';
import VideoChat from '../components/VideoChat';
import CodeTemplates from '../components/CodeTemplates';
import InterviewTimer from '../components/InterviewTimer';
import Whiteboard from '../components/Whiteboard';
import './Room.css';

const API_URL = 'http://localhost:3001';
const SOCKET_URL = 'http://localhost:3001';

function Room() {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Loading...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const isLocalChange = useRef(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-room', roomId);
    });

    // Load initial code
    socketRef.current.on('load-code', ({ code, language }) => {
      setCode(code);
      setLanguage(language);
    });

    // Receive code updates from other users
    socketRef.current.on('code-update', (newCode) => {
      isLocalChange.current = false;
      setCode(newCode);
    });

    // Receive language updates
    socketRef.current.on('language-update', (newLanguage) => {
      setLanguage(newLanguage);
    });

    // Receive output updates from code execution
    socketRef.current.on('output-update', (newOutput) => {
      setOutput(newOutput);
    });

    // Receive output clear events
    socketRef.current.on('output-cleared', () => {
      setOutput('');
    });

    // Handle user joined
    socketRef.current.on('user-joined', ({ userCount }) => {
      setUserCount(userCount);
    });

    // Handle user left
    socketRef.current.on('user-left', ({ userCount }) => {
      setUserCount(userCount);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error);
    });

    // Fetch room data
    fetchRoomData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/room/${roomId}`);
      setUserCount(response.data.userCount);
    } catch (error) {
      console.error('Error fetching room data:', error);
    }
  };

  const handleCodeChange = (newCode) => {
    isLocalChange.current = true;
    setCode(newCode);
    if (socketRef.current && isConnected) {
      socketRef.current.emit('code-change', { roomId, code: newCode });
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    if (socketRef.current && isConnected) {
      socketRef.current.emit('language-change', { roomId, language: newLanguage });
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  const insertTemplate = (templateCode) => {
    handleCodeChange(templateCode);
  };

  return (
    <div className="room">
      <div className="room-header">
        <div className="header-left">
          <h2>Coding Interview Room</h2>
          <span className="room-id">Room ID: {roomId.slice(0, 8)}...</span>
        </div>
        <div className="header-right">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="user-count">👥 {userCount} users</span>
          <button className="share-btn" onClick={copyRoomLink}>
            Share Link
          </button>
        </div>
      </div>

      <div className="room-toolbar">
        <div className="language-selector">
          <label htmlFor="language">Language:</label>
          <select id="language" value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>
        <CodeTemplates language={language} onInsert={insertTemplate} />
      </div>

      <div className="room-sidebar">
        <VideoChat 
          socket={socketRef.current}
          roomId={roomId}
          isConnected={isConnected}
        />
        <InterviewTimer
          socket={socketRef.current}
          roomId={roomId}
          isConnected={isConnected}
        />
        <Whiteboard
          socket={socketRef.current}
          roomId={roomId}
          isConnected={isConnected}
        />
      </div>

      <div className="room-content">
        <div className="editor-section">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
          />
        </div>
        <div className="output-section">
          <OutputPanel
            code={code}
            language={language}
            output={output}
            setOutput={setOutput}
            socket={socketRef.current}
            roomId={roomId}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
}

export default Room;
