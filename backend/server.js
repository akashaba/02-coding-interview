const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms and their code
const rooms = new Map();

// Create a new interview room
app.post('/api/create-room', (req, res) => {
  const roomId = uuidv4();
  rooms.set(roomId, {
    code: '// Start coding here...\n',
    language: 'javascript',
    users: []
  });
  res.json({ roomId, link: `http://localhost:5173/room/${roomId}` });
});

// Get room details
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    code: room.code,
    language: room.language,
    userCount: room.users.length
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    socket.join(roomId);
    room.users.push(socket.id);
    
    // Send current code to the new user
    socket.emit('load-code', {
      code: room.code,
      language: room.language
    });

    // Notify others about new user
    socket.to(roomId).emit('user-joined', {
      userCount: room.users.length
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle code changes
  socket.on('code-change', ({ roomId, code }) => {
    const room = rooms.get(roomId);
    
    if (room) {
      room.code = code;
      // Broadcast to all other users in the room
      socket.to(roomId).emit('code-update', code);
    }
  });

  // Handle language changes
  socket.on('language-change', ({ roomId, language }) => {
    const room = rooms.get(roomId);
    
    if (room) {
      room.language = language;
      // Broadcast to all other users in the room
      socket.to(roomId).emit('language-update', language);
    }
  });

  // Handle code execution output
  socket.on('code-executed', ({ roomId, output }) => {
    // Broadcast to all users in the room (including sender)
    io.to(roomId).emit('output-update', output);
  });

  // Handle output clear
  socket.on('output-cleared', ({ roomId }) => {
    // Broadcast to all users in the room (including sender)
    io.to(roomId).emit('output-cleared');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      const index = room.users.indexOf(socket.id);
      if (index > -1) {
        room.users.splice(index, 1);
        io.to(roomId).emit('user-left', {
          userCount: room.users.length
        });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
