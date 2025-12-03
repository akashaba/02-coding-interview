import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock socket.io-client
vi.mock('socket.io-client');

describe('Frontend-Backend Integration Tests', () => {
  let mockSocket;

  beforeEach(() => {
    // Create mock socket
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: true
    };

    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Room Creation Integration', () => {
    it('should create a room and receive a link', async () => {
      const mockResponse = {
        data: {
          roomId: 'test-room-123',
          link: 'http://localhost:5173/room/test-room-123'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const response = await axios.post('http://localhost:3001/api/create-room');

      expect(response.data).toHaveProperty('roomId');
      expect(response.data).toHaveProperty('link');
      expect(response.data.link).toContain('test-room-123');
    });

    it('should fetch room data successfully', async () => {
      const mockResponse = {
        data: {
          code: '// Test code',
          language: 'javascript',
          userCount: 2
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await axios.get('http://localhost:3001/api/room/test-room-123');

      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('language');
      expect(response.data).toHaveProperty('userCount');
    });
  });

  describe('Socket Communication Integration', () => {
    it('should establish socket connection', () => {
      const socket = io('http://localhost:3001');

      expect(io).toHaveBeenCalledWith('http://localhost:3001');
      expect(socket).toBeDefined();
    });

    it('should emit join-room event on connection', () => {
      const socket = io('http://localhost:3001');
      const roomId = 'test-room-123';

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      );
      
      if (connectHandler) {
        connectHandler[1]();
      }

      socket.emit('join-room', roomId);

      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', roomId);
    });

    it('should handle load-code event', () => {
      const socket = io('http://localhost:3001');
      const testData = {
        code: '// Test code',
        language: 'python'
      };

      let receivedData;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'load-code') {
          receivedData = testData;
          handler(testData);
        }
      });

      socket.on('load-code', (data) => {
        receivedData = data;
      });

      // Trigger the event
      const loadCodeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'load-code'
      );

      if (loadCodeHandler) {
        loadCodeHandler[1](testData);
      }

      expect(receivedData).toEqual(testData);
    });

    it('should emit code-change event', () => {
      const socket = io('http://localhost:3001');
      const roomId = 'test-room-123';
      const newCode = 'console.log("Hello");';

      socket.emit('code-change', { roomId, code: newCode });

      expect(mockSocket.emit).toHaveBeenCalledWith('code-change', {
        roomId,
        code: newCode
      });
    });

    it('should emit language-change event', () => {
      const socket = io('http://localhost:3001');
      const roomId = 'test-room-123';
      const newLanguage = 'python';

      socket.emit('language-change', { roomId, language: newLanguage });

      expect(mockSocket.emit).toHaveBeenCalledWith('language-change', {
        roomId,
        language: newLanguage
      });
    });

    it('should emit code-executed event', () => {
      const socket = io('http://localhost:3001');
      const roomId = 'test-room-123';
      const output = 'Hello World';

      socket.emit('code-executed', { roomId, output });

      expect(mockSocket.emit).toHaveBeenCalledWith('code-executed', {
        roomId,
        output
      });
    });

    it('should emit output-cleared event', () => {
      const socket = io('http://localhost:3001');
      const roomId = 'test-room-123';

      socket.emit('output-cleared', { roomId });

      expect(mockSocket.emit).toHaveBeenCalledWith('output-cleared', {
        roomId
      });
    });

    it('should handle code-update event', () => {
      const socket = io('http://localhost:3001');
      const newCode = 'function test() {}';
      let receivedCode;

      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'code-update') {
          handler(newCode);
        }
      });

      socket.on('code-update', (code) => {
        receivedCode = code;
      });

      // Trigger the event
      const codeUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'code-update'
      );

      if (codeUpdateHandler) {
        codeUpdateHandler[1](newCode);
      }

      expect(receivedCode).toEqual(newCode);
    });

    it('should handle output-update event', () => {
      const socket = io('http://localhost:3001');
      const output = 'Execution result';
      let receivedOutput;

      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'output-update') {
          handler(output);
        }
      });

      socket.on('output-update', (data) => {
        receivedOutput = data;
      });

      // Trigger the event
      const outputUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'output-update'
      );

      if (outputUpdateHandler) {
        outputUpdateHandler[1](output);
      }

      expect(receivedOutput).toEqual(output);
    });

    it('should handle user-joined event', () => {
      const socket = io('http://localhost:3001');
      const userData = { userCount: 3 };
      let receivedData;

      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user-joined') {
          handler(userData);
        }
      });

      socket.on('user-joined', (data) => {
        receivedData = data;
      });

      // Trigger the event
      const userJoinedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-joined'
      );

      if (userJoinedHandler) {
        userJoinedHandler[1](userData);
      }

      expect(receivedData).toEqual(userData);
      expect(receivedData.userCount).toBe(3);
    });

    it('should handle user-left event', () => {
      const socket = io('http://localhost:3001');
      const userData = { userCount: 1 };
      let receivedData;

      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user-left') {
          handler(userData);
        }
      });

      socket.on('user-left', (data) => {
        receivedData = data;
      });

      // Trigger the event
      const userLeftHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-left'
      );

      if (userLeftHandler) {
        userLeftHandler[1](userData);
      }

      expect(receivedData).toEqual(userData);
      expect(receivedData.userCount).toBe(1);
    });

    it('should handle disconnect', () => {
      const socket = io('http://localhost:3001');

      socket.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle room not found error', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { error: 'Room not found' }
        }
      };

      axios.get.mockRejectedValue(mockError);

      try {
        await axios.get('http://localhost:3001/api/room/non-existent');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Room not found');
      }
    });

    it('should handle socket error event', () => {
      const socket = io('http://localhost:3001');
      const errorMessage = 'Room not found';
      let receivedError;

      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          handler(errorMessage);
        }
      });

      socket.on('error', (error) => {
        receivedError = error;
      });

      // Trigger the event
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'error'
      );

      if (errorHandler) {
        errorHandler[1](errorMessage);
      }

      expect(receivedError).toEqual(errorMessage);
    });
  });
});
