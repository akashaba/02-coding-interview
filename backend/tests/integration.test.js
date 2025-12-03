const request = require('supertest');
const { io: Client } = require('socket.io-client');
const http = require('http');
const { expect } = require('chai');

// Import the app components
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');

describe('Integration Tests - Client-Server Interaction', () => {
  let server;
  let httpServer;
  let io;
  let app;
  let clientSocket1;
  let clientSocket2;
  let serverPort;
  const rooms = new Map();

  before((done) => {
    // Set up server
    app = express();
    httpServer = http.createServer(app);
    io = socketIo(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    app.use(cors());
    app.use(express.json());

    // Create room endpoint
    app.post('/api/create-room', (req, res) => {
      const roomId = 'test-room-' + Date.now();
      rooms.set(roomId, {
        code: '// Start coding here...\n',
        language: 'javascript',
        users: []
      });
      res.json({ roomId, link: `http://localhost:${serverPort}/room/${roomId}` });
    });

    // Get room endpoint
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

    // Socket.IO handlers
    io.on('connection', (socket) => {
      socket.on('join-room', (roomId) => {
        const room = rooms.get(roomId);
        
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        socket.join(roomId);
        room.users.push(socket.id);
        
        socket.emit('load-code', {
          code: room.code,
          language: room.language
        });

        socket.to(roomId).emit('user-joined', {
          userCount: room.users.length
        });
      });

      socket.on('code-change', ({ roomId, code }) => {
        const room = rooms.get(roomId);
        if (room) {
          room.code = code;
          socket.to(roomId).emit('code-update', code);
        }
      });

      socket.on('language-change', ({ roomId, language }) => {
        const room = rooms.get(roomId);
        if (room) {
          room.language = language;
          socket.to(roomId).emit('language-update', language);
        }
      });

      socket.on('code-executed', ({ roomId, output }) => {
        io.to(roomId).emit('output-update', output);
      });

      socket.on('output-cleared', ({ roomId }) => {
        io.to(roomId).emit('output-cleared');
      });

      socket.on('disconnect', () => {
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

    httpServer.listen(0, () => {
      serverPort = httpServer.address().port;
      done();
    });
  });

  after((done) => {
    io.close();
    httpServer.close(done);
  });

  afterEach(() => {
    if (clientSocket1 && clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
    rooms.clear();
  });

  describe('REST API Tests', () => {
    it('should create a new room', (done) => {
      request(app)
        .post('/api/create-room')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('roomId');
          expect(res.body).to.have.property('link');
          expect(res.body.roomId).to.include('test-room-');
          done();
        });
    });

    it('should get room details', (done) => {
      const roomId = 'test-room-123';
      rooms.set(roomId, {
        code: '// Test code',
        language: 'javascript',
        users: []
      });

      request(app)
        .get(`/api/room/${roomId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('code', '// Test code');
          expect(res.body).to.have.property('language', 'javascript');
          expect(res.body).to.have.property('userCount', 0);
          done();
        });
    });

    it('should return 404 for non-existent room', (done) => {
      request(app)
        .get('/api/room/non-existent-room')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Room not found');
          done();
        });
    });
  });

  describe('WebSocket Tests', () => {
    it('should connect to the server', (done) => {
      clientSocket1 = Client(`http://localhost:${serverPort}`);
      
      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).to.be.true;
        done();
      });
    });

    it('should join a room and receive initial code', (done) => {
      const roomId = 'test-room-join';
      rooms.set(roomId, {
        code: '// Initial code',
        language: 'python',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      
      clientSocket1.on('connect', () => {
        clientSocket1.emit('join-room', roomId);
      });

      clientSocket1.on('load-code', (data) => {
        expect(data.code).to.equal('// Initial code');
        expect(data.language).to.equal('python');
        done();
      });
    });

    it('should synchronize code changes between clients', (done) => {
      const roomId = 'test-room-sync';
      rooms.set(roomId, {
        code: '// Start',
        language: 'javascript',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      clientSocket2 = Client(`http://localhost:${serverPort}`);

      let socket1Connected = false;
      let socket2Connected = false;

      clientSocket1.on('connect', () => {
        socket1Connected = true;
        clientSocket1.emit('join-room', roomId);
        if (socket2Connected) {
          clientSocket2.emit('join-room', roomId);
        }
      });

      clientSocket2.on('connect', () => {
        socket2Connected = true;
        if (socket1Connected) {
          clientSocket2.emit('join-room', roomId);
        }
      });

      clientSocket2.on('load-code', () => {
        // Socket 1 changes code
        clientSocket1.emit('code-change', {
          roomId,
          code: 'console.log("Updated code");'
        });
      });

      clientSocket2.on('code-update', (newCode) => {
        expect(newCode).to.equal('console.log("Updated code");');
        done();
      });
    });

    it('should synchronize language changes between clients', (done) => {
      const roomId = 'test-room-lang';
      rooms.set(roomId, {
        code: '// Code',
        language: 'javascript',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      clientSocket2 = Client(`http://localhost:${serverPort}`);

      let bothConnected = 0;

      const checkConnection = () => {
        bothConnected++;
        if (bothConnected === 2) {
          clientSocket1.emit('language-change', {
            roomId,
            language: 'python'
          });
        }
      };

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join-room', roomId);
        checkConnection();
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join-room', roomId);
        checkConnection();
      });

      clientSocket2.on('language-update', (newLanguage) => {
        expect(newLanguage).to.equal('python');
        done();
      });
    });

    it('should synchronize code execution output between clients', (done) => {
      const roomId = 'test-room-output';
      rooms.set(roomId, {
        code: 'console.log("Hello");',
        language: 'javascript',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      clientSocket2 = Client(`http://localhost:${serverPort}`);

      let bothJoined = 0;

      const checkJoined = () => {
        bothJoined++;
        if (bothJoined === 2) {
          clientSocket1.emit('code-executed', {
            roomId,
            output: 'Hello'
          });
        }
      };

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join-room', roomId);
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join-room', roomId);
      });

      clientSocket1.on('load-code', () => {
        checkJoined();
      });

      clientSocket2.on('load-code', () => {
        checkJoined();
      });

      clientSocket2.on('output-update', (output) => {
        expect(output).to.equal('Hello');
        done();
      });
    });

    it('should synchronize output clearing between clients', (done) => {
      const roomId = 'test-room-clear';
      rooms.set(roomId, {
        code: '// Code',
        language: 'javascript',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      clientSocket2 = Client(`http://localhost:${serverPort}`);

      let bothJoined = 0;

      const checkJoined = () => {
        bothJoined++;
        if (bothJoined === 2) {
          clientSocket1.emit('output-cleared', { roomId });
        }
      };

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join-room', roomId);
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join-room', roomId);
      });

      clientSocket1.on('load-code', () => {
        checkJoined();
      });

      clientSocket2.on('load-code', () => {
        checkJoined();
      });

      clientSocket2.on('output-cleared', () => {
        expect(true).to.be.true;
        done();
      });
    });

    it('should notify when a user joins', (done) => {
      const roomId = 'test-room-user-join';
      rooms.set(roomId, {
        code: '// Code',
        language: 'javascript',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      clientSocket2 = Client(`http://localhost:${serverPort}`);

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join-room', roomId);
      });

      clientSocket1.on('load-code', () => {
        // First user joined, now connect second user
        clientSocket2 = Client(`http://localhost:${serverPort}`);
        
        clientSocket2.on('connect', () => {
          clientSocket2.emit('join-room', roomId);
        });
      });

      clientSocket1.on('user-joined', (data) => {
        expect(data.userCount).to.equal(2);
        done();
      });
    });

    it('should notify when a user leaves', (done) => {
      const roomId = 'test-room-user-leave';
      rooms.set(roomId, {
        code: '// Code',
        language: 'javascript',
        users: []
      });

      clientSocket1 = Client(`http://localhost:${serverPort}`);
      clientSocket2 = Client(`http://localhost:${serverPort}`);

      let bothJoined = 0;

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join-room', roomId);
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join-room', roomId);
      });

      const checkBothJoined = () => {
        bothJoined++;
        if (bothJoined === 2) {
          // Both joined, now disconnect socket2
          setTimeout(() => {
            clientSocket2.disconnect();
          }, 100);
        }
      };

      clientSocket1.on('load-code', () => {
        checkBothJoined();
      });

      clientSocket2.on('load-code', () => {
        checkBothJoined();
      });

      clientSocket1.on('user-left', (data) => {
        expect(data.userCount).to.equal(1);
        done();
      });
    });

    it('should handle multiple clients in the same room', (done) => {
      const roomId = 'test-room-multiple';
      rooms.set(roomId, {
        code: '// Start',
        language: 'javascript',
        users: []
      });

      const clients = [];
      const numClients = 3;
      let connectedCount = 0;
      let receivedUpdates = 0;

      for (let i = 0; i < numClients; i++) {
        const client = Client(`http://localhost:${serverPort}`);
        clients.push(client);

        client.on('connect', () => {
          client.emit('join-room', roomId);
        });

        client.on('load-code', () => {
          connectedCount++;
          if (connectedCount === numClients) {
            // All connected, send code change from first client
            clients[0].emit('code-change', {
              roomId,
              code: '// Updated by client 0'
            });
          }
        });

        if (i > 0) {
          client.on('code-update', (code) => {
            expect(code).to.equal('// Updated by client 0');
            receivedUpdates++;
            if (receivedUpdates === numClients - 1) {
              // All other clients received the update
              clients.forEach(c => c.disconnect());
              done();
            }
          });
        }
      }
    });
  });
});
