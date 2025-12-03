# Multi-stage Dockerfile for Online Coding Interview Platform
# Combines both backend and frontend in a single container

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL frontend dependencies (including dev deps for build)
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Setup Backend and Serve
FROM node:18-alpine AS production

WORKDIR /app

# Install serve to host the frontend build
RUN npm install -g serve

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy frontend build from previous stage
WORKDIR /app
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose ports
# 3001 for backend API/WebSocket
# 5173 for frontend (served via serve)
EXPOSE 3001 5173

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node server.js &' >> /app/start.sh && \
    echo 'serve -s /app/frontend/dist -l 5173' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both services
CMD ["/app/start.sh"]
