import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket, broadcastToBoard } from './socket';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import listRoutes from './routes/lists';
import taskRoutes from './routes/tasks';
import activityRoutes from './routes/activity';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Socket.io (initialized BEFORE routes so req.io is available)
const io = setupSocket(httpServer);
app.set('io', io);

// Inject io + broadcast helper into every request
app.use((req: any, _res, next) => {
  req.io = io;
  req.broadcastToBoard = (boardId: string, event: string, data: any) => {
    broadcastToBoard(io, boardId, event, data);
  };
  next();
});

// REST Routes (registered AFTER broadcast middleware)
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

export { app, httpServer, io };
