# Frontend - Online Coding Interview Platform

React + Vite frontend with Monaco Editor and Socket.IO client.

## Installation

```bash
npm install
```

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── CodeEditor.jsx      # Monaco editor wrapper
│   ├── CodeEditor.css
│   ├── OutputPanel.jsx     # Code execution and output
│   └── OutputPanel.css
├── pages/
│   ├── Home.jsx            # Landing/room creation page
│   ├── Home.css
│   ├── Room.jsx            # Interview room page
│   └── Room.css
├── App.jsx                 # Main app with routing
├── App.css
├── main.jsx                # Entry point
└── index.css               # Global styles
```

## Features

### Monaco Editor
- Syntax highlighting for multiple languages
- IntelliSense and autocomplete
- Multiple cursors
- Find and replace
- Code formatting

### Real-time Collaboration
- WebSocket connection via Socket.IO
- Automatic reconnection
- User count display
- Connection status indicator

### Code Execution
- JavaScript execution in browser
- Custom console output capture
- Error handling
- Execution status feedback

## Dependencies

- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `@monaco-editor/react` - Code editor
- `socket.io-client` - WebSocket client
- `axios` - HTTP client

## Development Dependencies

- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `@types/react` - TypeScript types
- `@types/react-dom` - TypeScript types

## Configuration

The app expects the backend to be running on `http://localhost:3001`. If you need to change this, update the `API_URL` and `SOCKET_URL` constants in `src/pages/Room.jsx` and `src/pages/Home.jsx`.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Monaco Editor works best in modern browsers with good WebAssembly support.
