import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'task-collab-super-secret-key-2024';

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId}`);

    // Join a board room
    socket.on('board:join', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`User ${userId} joined board ${boardId}`);
    });

    // Leave a board room
    socket.on('board:leave', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`User ${userId} left board ${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
}

// Helper to broadcast events to a board room
export function broadcastToBoard(io: Server, boardId: string, event: string, data: any, excludeSocketId?: string) {
  if (excludeSocketId) {
    io.to(`board:${boardId}`).except(excludeSocketId).emit(event, data);
  } else {
    io.to(`board:${boardId}`).emit(event, data);
  }
}
