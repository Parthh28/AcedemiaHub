// server.js — HTTP server entry point with Socket.io
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initWebSocket } = require('./src/websockets/notifications');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║     📚 Notes Marketplace API — Running!            ║
║                                                    ║
║   ➜ API:      http://localhost:${PORT}/api/v1       ║
║   ➜ Health:   http://localhost:${PORT}/health       ║
║   ➜ Frontend: http://localhost:${PORT}/             ║
║                                                    ║
║   Database:   Supabase PostgreSQL ☁️               ║
║   Auth:       JWT (30d access + 90d refresh)       ║
║   WebSocket:  Socket.io                            ║
╚════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
