import { useState, useEffect, useRef } from 'react';
import './InterviewTimer.css';

export default function InterviewTimer({ socket, roomId, isConnected }) {
  const [duration, setDuration] = useState(45 * 60); // 45 minutes default
  const [remainingTime, setRemainingTime] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for timer sync events
    socket.on('timer-started', ({ duration: dur, remainingTime: remaining }) => {
      setDuration(dur);
      setRemainingTime(remaining);
      setIsRunning(true);
      setIsExpired(false);
      startLocalTimer(remaining);
    });

    socket.on('timer-paused', ({ remainingTime: remaining }) => {
      setRemainingTime(remaining);
      setIsRunning(false);
      stopLocalTimer();
    });

    socket.on('timer-resumed', ({ remainingTime: remaining }) => {
      setRemainingTime(remaining);
      setIsRunning(true);
      setIsExpired(false);
      startLocalTimer(remaining);
    });

    socket.on('timer-reset', ({ duration: dur }) => {
      setDuration(dur);
      setRemainingTime(dur);
      setIsRunning(false);
      setIsExpired(false);
      stopLocalTimer();
    });

    return () => {
      socket.off('timer-started');
      socket.off('timer-paused');
      socket.off('timer-resumed');
      socket.off('timer-reset');
      stopLocalTimer();
    };
  }, [socket, isConnected]);

  const startLocalTimer = (startTime) => {
    stopLocalTimer();
    let time = startTime;
    
    intervalRef.current = setInterval(() => {
      time--;
      setRemainingTime(time);
      
      if (time <= 0) {
        setIsExpired(true);
        setIsRunning(false);
        stopLocalTimer();
        playAlertSound();
      }
    }, 1000);
  };

  const stopLocalTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const playAlertSound = () => {
    // Play browser notification sound
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Interview Timer', {
        body: 'Time is up!',
        icon: '/timer-icon.png'
      });
    }
  };

  const handleStart = () => {
    if (socket && isConnected) {
      socket.emit('timer-start', { roomId, duration });
    }
  };

  const handlePause = () => {
    if (socket && isConnected) {
      socket.emit('timer-pause', { roomId, remainingTime });
    }
  };

  const handleResume = () => {
    if (socket && isConnected) {
      socket.emit('timer-resume', { roomId, remainingTime });
    }
  };

  const handleReset = () => {
    if (socket && isConnected) {
      socket.emit('timer-reset', { roomId, duration });
    }
  };

  const handleDurationChange = (minutes) => {
    const newDuration = minutes * 60;
    setDuration(newDuration);
    setRemainingTime(newDuration);
    setIsExpired(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - remainingTime) / duration) * 100;
  };

  const getTimeColor = () => {
    const percentage = (remainingTime / duration) * 100;
    if (percentage <= 10) return '#f44336';
    if (percentage <= 25) return '#ff9800';
    return '#4CAF50';
  };

  return (
    <div className="interview-timer">
      <div className="timer-header">
        <h3>⏱️ Interview Timer</h3>
      </div>

      <div className="timer-display" style={{ borderColor: getTimeColor() }}>
        <div className="timer-text" style={{ color: getTimeColor() }}>
          {formatTime(remainingTime)}
        </div>
        {isExpired && <div className="timer-expired">TIME'S UP!</div>}
        <div className="timer-progress-bar">
          <div 
            className="timer-progress-fill"
            style={{ 
              width: `${getProgressPercentage()}%`,
              backgroundColor: getTimeColor()
            }}
          />
        </div>
      </div>

      {!isRunning && !isExpired && (
        <div className="timer-presets">
          <span>Quick Set:</span>
          <button onClick={() => handleDurationChange(15)}>15m</button>
          <button onClick={() => handleDurationChange(30)}>30m</button>
          <button onClick={() => handleDurationChange(45)}>45m</button>
          <button onClick={() => handleDurationChange(60)}>60m</button>
        </div>
      )}

      <div className="timer-controls">
        {!isRunning ? (
          <button 
            className="timer-btn start"
            onClick={handleStart}
            disabled={isExpired}
          >
            ▶️ Start
          </button>
        ) : (
          <>
            <button 
              className="timer-btn pause"
              onClick={handlePause}
            >
              ⏸️ Pause
            </button>
            <button 
              className="timer-btn reset"
              onClick={handleReset}
            >
              🔄 Reset
            </button>
          </>
        )}
        
        {!isRunning && remainingTime < duration && !isExpired && (
          <button 
            className="timer-btn resume"
            onClick={handleResume}
          >
            ▶️ Resume
          </button>
        )}
      </div>

      <div className="timer-info">
        <small>
          Timer is synchronized across all participants
        </small>
      </div>
    </div>
  );
}
