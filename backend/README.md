# Backend - Online Coding Interview Platform

Express.js backend with Socket.IO for real-time collaboration.

## Installation

```bash
npm install
```

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server runs on port 3001 by default.

## Environment Variables

You can set the following environment variables:

- `PORT` - Server port (default: 3001)

## API Documentation

### Create Room
- **Endpoint**: `POST /api/create-room`
- **Response**: 
```json
{
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "link": "http://localhost:5173/room/550e8400-e29b-41d4-a716-446655440000"
}
```

### Get Room
- **Endpoint**: `GET /api/room/:roomId`
- **Response**:
```json
{
  "code": "// code content",
  "language": "javascript",
  "userCount": 2
}
```

## Socket.IO Events

### Client Events (received)
- `join-room(roomId)` - Join a specific room
- `code-change({ roomId, code })` - Update code
- `language-change({ roomId, language })` - Change language

### Server Events (emitted)
- `load-code({ code, language })` - Send initial code
- `code-update(code)` - Broadcast code changes
- `language-update(language)` - Broadcast language changes
- `user-joined({ userCount })` - Notify user joined
- `user-left({ userCount })` - Notify user left
- `error(message)` - Send error message

## Dependencies

- `express` - Web framework
- `socket.io` - Real-time communication
- `cors` - Cross-origin resource sharing
- `uuid` - Generate unique IDs

## Development Dependencies

- `nodemon` - Auto-restart on file changes
