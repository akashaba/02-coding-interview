import { useState, useEffect, useRef } from 'react';
import './VideoChat.css';

export default function VideoChat({ socket, roomId, isConnected }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [peers, setPeers] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  // WebRTC configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for WebRTC signaling events
    socket.on('webrtc-offer', handleReceiveOffer);
    socket.on('webrtc-answer', handleReceiveAnswer);
    socket.on('webrtc-ice-candidate', handleReceiveIceCandidate);
    socket.on('peer-disconnected', handlePeerDisconnected);

    return () => {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
      socket.off('peer-disconnected', handlePeerDisconnected);
      
      // Clean up streams
      stopAllStreams();
    };
  }, [socket, isConnected]);

  const handleReceiveOffer = async ({ from, offer }) => {
    try {
      const peerConnection = createPeerConnection(from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', { roomId, to: from, answer });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleReceiveAnswer = async ({ from, answer }) => {
    try {
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleReceiveIceCandidate = async ({ from, candidate }) => {
    try {
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handlePeerDisconnected = ({ userId }) => {
    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close();
      delete peerConnectionsRef.current[userId];
      
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    }
  };

  const createPeerConnection = (peerId) => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }

    const peerConnection = new RTCPeerConnection(iceServers);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          roomId,
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setPeers(prev => ({
        ...prev,
        [peerId]: event.streams[0]
      }));
    };

    peerConnectionsRef.current[peerId] = peerConnection;
    return peerConnection;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create offers for all existing peers
      socket.emit('request-peers', { roomId });
      
      // Listen for peer list
      socket.once('peers-list', async ({ peers: peerList }) => {
        for (const peerId of peerList) {
          const peerConnection = createPeerConnection(peerId);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          socket.emit('webrtc-offer', { roomId, to: peerId, offer });
        }
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const stopAllStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    setPeers({});
  };

  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      await startLocalStream();
    } else {
      setIsVideoEnabled(false);
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    stopAllStreams();
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
  };

  return (
    <div className={`video-chat ${isMinimized ? 'minimized' : ''}`}>
      <div className="video-chat-header">
        <h3>📹 Video Chat</h3>
        <button 
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '⬆️' : '⬇️'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <div className="video-grid">
            <div className="video-container local">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
              <span className="video-label">You</span>
            </div>
            
            {Object.entries(peers).map(([peerId, stream]) => (
              <PeerVideo key={peerId} stream={stream} peerId={peerId} />
            ))}
          </div>

          <div className="video-controls">
            <button
              className={`control-btn ${isVideoEnabled ? 'active' : ''}`}
              onClick={toggleVideo}
              title="Toggle Video"
            >
              {isVideoEnabled ? '📹' : '📹❌'}
            </button>
            
            <button
              className={`control-btn ${isAudioEnabled ? 'active' : ''}`}
              onClick={toggleAudio}
              disabled={!isVideoEnabled}
              title="Toggle Audio"
            >
              {isAudioEnabled ? '🎤' : '🎤❌'}
            </button>
            
            <button
              className="control-btn end-call"
              onClick={endCall}
              disabled={!isVideoEnabled}
              title="End Call"
            >
              📞❌
            </button>
          </div>

          {!isVideoEnabled && (
            <p className="video-hint">
              Click the video button to start video/audio chat
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PeerVideo({ stream, peerId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container peer">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="video-element"
      />
      <span className="video-label">Peer</span>
    </div>
  );
}
