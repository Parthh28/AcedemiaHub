// src/websockets/notifications.js — Socket.io real-time notification hub
let io;

function initWebSocket(httpServer) {
  const { Server } = require('socket.io');
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

  io = new Server(httpServer, {
    cors: { origin: [FRONTEND_URL, 'http://localhost:3000'], methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client sends their userId to join their personal room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket] User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ WebSocket server initialized');
  return io;
}

// Send a real-time notification to a specific user
function notifyUser(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('new_notification', notification);
}

// Broadcast to all connected clients (admin alerts, etc.)
function broadcast(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = { initWebSocket, notifyUser, broadcast };
