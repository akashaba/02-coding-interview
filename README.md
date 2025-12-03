# Online Coding Interview Platform

A real-time collaborative coding interview platform built with React, Vite, Express.js, and Socket.IO. Share interview links, collaborate on code in real-time, and execute code directly in the browser.

## Features

- 🔗 **Shareable Interview Links** - Create and share unique interview room links
- 👥 **Real-time Collaboration** - Multiple users can edit code simultaneously
- 🎨 **Syntax Highlighting** - Support for JavaScript, Python, Java, C++, C#, Go, Rust, and TypeScript (via Monaco Editor)
- ▶️ **Code Execution** - Run JavaScript and Python code safely in the browser using WASM
  - **JavaScript**: Direct execution using `new Function()`
  - **Python**: Compiled to WASM using **Pyodide**
- 🌐 **WebSocket Communication** - Instant synchronization across all connected users
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ✅ **Comprehensive Tests** - Integration tests for client-server interaction

## Tech Stack

### Backend
- **Express.js** - Web server framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing
- **UUID** - Generate unique room IDs

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor with syntax highlighting (same as VS Code)
- **Socket.IO Client** - WebSocket client
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Pyodide** - Python interpreter compiled to WebAssembly for browser execution

## Project Structure

```
02-coding-interview/
├── backend/
│   ├── tests/
│   │   └── integration.test.js   # Backend integration tests
│   ├── server.js           # Express + Socket.IO server
│   ├── package.json        # Backend dependencies
│   ├── README.md           # Backend documentation
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx    # Monaco editor wrapper
│   │   │   ├── CodeEditor.css
│   │   │   ├── OutputPanel.jsx   # Code execution panel
│   │   │   └── OutputPanel.css
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Home.css
│   │   │   ├── Room.jsx          # Interview room
│   │   │   └── Room.css
│   │   ├── App.jsx               # Main app component
│   │   ├── App.css
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── tests/
│   │   ├── integration.test.jsx  # Frontend integration tests
│   │   └── setup.js              # Test setup
│   ├── index.html
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── package.json        # Frontend dependencies
│   ├── README.md           # Frontend documentation
│   └── .gitignore
├── package.json            # Root package with concurrently scripts
├── .gitignore
├── README.md               # Main documentation
└── TEST_RESULTS.md         # Test results summary
```

## Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Running

#### Option 1: One Command (Recommended) ⚡

Install all dependencies:
```powershell
npm run install:all
```

Run both frontend and backend:
```powershell
npm run dev
```

Then open `http://localhost:5173` in your browser.

#### Option 2: Separate Terminals

**Terminal 1 - Backend:**
```powershell
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

### Running Tests

#### All Tests at Once

```powershell
npm test
```

#### Backend Integration Tests

```powershell
cd backend
npm test
```

Run tests in watch mode:
```powershell
npm run test:watch
```

#### Frontend Tests

```powershell
cd frontend
npm test
```

Run tests in watch mode:
```powershell
npm run test:watch
```

Run tests with coverage:
```powershell
npm run test:coverage
```

### Building for Production

#### Build Frontend

```powershell
cd frontend
npm run build
```

The build output will be in `frontend/dist/`

#### Preview Production Build

```powershell
cd frontend
npm run preview
```

## All Available Commands

### Root Commands (Run Both Frontend & Backend)

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies (root, backend, frontend) |
| `npm run dev` | Run both servers in development mode with auto-reload |
| `npm start` | Run both servers (backend: production, frontend: dev) |
| `npm test` | Run all tests (backend + frontend) |

### Backend Commands (from `backend/`)

| Command | Description |
|---------|-------------|
| `npm install` | Install backend dependencies |
| `npm start` | Start the server (production mode) |
| `npm run dev` | Start the server with auto-reload (development mode) |
| `npm test` | Run integration tests |
| `npm run test:watch` | Run tests in watch mode |

### Frontend Commands (from `frontend/`)

| Command | Description |
|---------|-------------|
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Usage

1. **Start both servers** (backend and frontend)

2. **Open your browser** and navigate to `http://localhost:5173`

3. **Create a room** by clicking "Create Interview Room"

4. **Share the link** with candidates

5. **Start coding** - All users in the room will see real-time updates

6. **Run code** - Click "Run Code" to execute JavaScript
   - ✅ Execution results are synchronized across all users
   - ✅ Everyone in the room sees the same output in real-time

7. **Change language** - Select from the dropdown (synced to all users)

## Testing Strategy

### Integration Tests

The project includes comprehensive integration tests that verify:

#### Backend Tests (`backend/tests/integration.test.js`)
- ✅ REST API endpoints (create room, get room details)
- ✅ WebSocket connection establishment
- ✅ Room joining and code loading
- ✅ Real-time code synchronization between multiple clients
- ✅ Language change synchronization
- ✅ Code execution output synchronization
- ✅ Output clearing synchronization
- ✅ User join/leave notifications
- ✅ Multiple clients in the same room

#### Frontend Tests (`frontend/tests/integration.test.jsx`)
- ✅ Room creation API calls
- ✅ Socket connection initialization
- ✅ Event emission (join-room, code-change, language-change, code-executed)
- ✅ Event handling (load-code, code-update, output-update, user-joined/left)
- ✅ Error handling (404, socket errors)

### Running All Tests

To run the complete test suite:

```powershell
# Terminal 1 - Backend tests
cd backend
npm test

# Terminal 2 - Frontend tests
cd frontend
npm test
```

### Test Coverage

View test coverage for the frontend:

```powershell
cd frontend
npm run test:coverage
```

This generates an HTML coverage report in `frontend/coverage/`

## How It Works

### Room Creation
- User clicks "Create Interview Room"
- Backend generates a unique UUID for the room
- Room is stored in memory with initial code and settings
- User receives a shareable link

### Real-time Collaboration
- When a user joins, they connect via Socket.IO
- Initial code is loaded from the server
- Code changes are emitted to the server
- Server broadcasts changes to all other users in the room
- Monaco Editor displays the updated code
### Code Execution
- **JavaScript**: Runs in the browser using `new Function()` with custom console object to capture logs
- **Python**: Executes using Pyodide (CPython 3.11 compiled to WebAssembly)
  - Loads on-demand from CDN (first execution may take a few seconds)
  - Full Python standard library available
  - No server required - runs entirely in the browser for security
- **Other languages**: Require backend compiler services (not included in basic version)
- Other languages require backend compiler services (not included in basic version)

## API Endpoints

### POST `/api/create-room`
Creates a new interview room
- **Response**: `{ roomId: string, link: string }`

### GET `/api/room/:roomId`
Gets room details
- **Response**: `{ code: string, language: string, userCount: number }`

## Socket.IO Events

### Client → Server
- `join-room` - Join an interview room
- `code-change` - Send code update
- `language-change` - Change programming language
- `code-executed` - Send code execution output
- `output-cleared` - Clear output panel

### Server → Client
- `load-code` - Initial code on join
- `code-update` - Code changed by another user
- `language-update` - Language changed by another user
- `output-update` - Code execution output (broadcast to all)
- `output-cleared` - Output cleared (broadcast to all)
- `user-joined` - New user joined
- `user-left` - User disconnected
- `error` - Error message

## Troubleshooting

### Common Issues

**Port already in use:**
```powershell
# Check what's using the port
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :5173  # Frontend

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Tests failing:**
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm test
```

**Socket connection issues:**
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify firewall settings allow local connections

## Docker Deployment

### Using Docker Compose (Recommended)

Build and run the container:
```powershell
docker-compose up --build
```

Run in detached mode:
```powershell
docker-compose up -d
```

Stop the container:
```powershell
docker-compose down
```

### Using Docker Commands

Build the image:
```powershell
docker build -t coding-interview-platform .
```

Run the container:
```powershell
docker run -d -p 3001:3001 -p 5173:5173 --name coding-interview coding-interview-platform
```

View logs:
```powershell
docker logs -f coding-interview
```

Stop and remove:
```powershell
docker stop coding-interview
docker rm coding-interview
```

### Base Image

The Dockerfile uses **node:18-alpine** as the base image:
- Lightweight Alpine Linux distribution
- Node.js 18 LTS for stability
- Multi-stage build to minimize final image size
- Production-ready dependencies only

### Container Architecture

The container runs both services:
- **Backend**: Express.js + Socket.IO on port 3001
- **Frontend**: Static build served via `serve` on port 5173

## Cloud Deployment

### Azure Container Apps (Recommended)

Deploy to Azure with one command:

```powershell
# PowerShell
.\deploy-azure.ps1

# Or Bash
./deploy-azure.sh
```

**Why Azure Container Apps?**
- ✅ Serverless pricing (~$8-12/month with free tier)
- ✅ WebSocket support for Socket.IO
- ✅ Auto-scaling (1-3 replicas)
- ✅ Built-in HTTPS and SSL
- ✅ No Kubernetes complexity

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment guide.

**Quick setup:**
1. Install [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
2. Login: `az login`
3. Run deployment script
4. Get your URL: `https://your-app.azurecontainerapps.io`

### Other Deployment Options

- **Render.com** - Free tier available
- **Railway.app** - Pay-as-you-go pricing
- **Fly.io** - Global edge deployment
- **DigitalOcean App Platform** - $5/month starter
- **AWS ECS/Fargate** - Enterprise scale
- **Google Cloud Run** - Serverless containers

## Future Enhancements

- [ ] Backend code execution service (Judge0, Piston API)
- [ ] User authentication
- [ ] Persistent room storage (database)
- [ ] Video/audio chat integration
- [ ] Code templates and snippets
- [ ] Interview timer
- [ ] Collaborative whiteboard
- [ ] Code diff/history viewer
- [ ] Export interview sessions
- [ ] End-to-end tests with Playwright/Cypress
- [x] Docker containerization
- [ ] CI/CD pipeline

## Security Notes

⚠️ **Current limitations:**
- Rooms are stored in memory (not persistent)
- No authentication required
- JavaScript execution has basic safety measures but is not sandboxed
- For production, implement proper authentication, sandboxing, and persistent storage

## Performance Considerations

- Room data is stored in memory; restart clears all rooms
- WebSocket connections scale well for small to medium rooms
- For large-scale deployment, consider Redis for room storage and Socket.IO adapter

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
