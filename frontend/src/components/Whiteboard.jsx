import { useRef, useEffect, useState } from 'react';
import './Whiteboard.css';

export default function Whiteboard({ socket, roomId, isConnected }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isMinimized, setIsMinimized] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('whiteboard-draw', handleRemoteDraw);
    socket.on('whiteboard-clear', handleRemoteClear);

    return () => {
      socket.off('whiteboard-draw', handleRemoteDraw);
      socket.off('whiteboard-clear', handleRemoteClear);
    };
  }, [socket, isConnected]);

  const handleRemoteDraw = ({ tool: remoteTool, color: remoteColor, lineWidth: remoteWidth, startX, startY, endX, endY }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (remoteTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = remoteColor;
    }
    
    ctx.lineWidth = remoteWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  const handleRemoteClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const pos = getCanvasCoordinates(e);
    lastPosRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPos = getCanvasCoordinates(e);

    // Set drawing style
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    
    ctx.lineWidth = lineWidth;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    // Emit to other users
    if (socket && isConnected) {
      socket.emit('whiteboard-draw', {
        roomId,
        tool,
        color,
        lineWidth,
        startX: lastPosRef.current.x,
        startY: lastPosRef.current.y,
        endX: currentPos.x,
        endY: currentPos.y
      });
    }

    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Emit to other users
    if (socket && isConnected) {
      socket.emit('whiteboard-clear', { roomId });
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = url;
    link.click();
  };

  return (
    <div className={`whiteboard ${isMinimized ? 'minimized' : ''}`}>
      <div className="whiteboard-header">
        <h3>🎨 Whiteboard</h3>
        <button 
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '⬆️' : '⬇️'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="whiteboard-toolbar">
            <div className="tool-group">
              <button
                className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
                onClick={() => setTool('pen')}
                title="Pen"
              >
                ✏️
              </button>
              <button
                className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                onClick={() => setTool('eraser')}
                title="Eraser"
              >
                🧹
              </button>
            </div>

            <div className="tool-group">
              <label>
                <span>Color:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={tool === 'eraser'}
                />
              </label>
            </div>

            <div className="tool-group">
              <label>
                <span>Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                />
                <span className="size-indicator">{lineWidth}px</span>
              </label>
            </div>

            <div className="tool-group">
              <button
                className="tool-btn"
                onClick={clearCanvas}
                title="Clear All"
              >
                🗑️ Clear
              </button>
              <button
                className="tool-btn"
                onClick={downloadCanvas}
                title="Download"
              >
                💾 Save
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          <div className="whiteboard-info">
            <small>Draw diagrams, explain algorithms, or sketch ideas. Synced in real-time!</small>
          </div>
        </>
      )}
    </div>
  );
}
