import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { AIService } from './services/aiService';
import { CollaborationService } from './services/collaborationService';
import { createMindMapRouter } from './routes/mindMap';
import { AIProvider } from './types';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

const aiProvider = (process.env.AI_PROVIDER || 'mock') as AIProvider;
const aiService = new AIService({
  type: aiProvider,
  apiKey: process.env.OPENAI_API_KEY || process.env.ERNIE_API_KEY || process.env.DASHSCOPE_API_KEY,
  secretKey: process.env.ERNIE_SECRET_KEY,
  model: process.env.OPENAI_MODEL || process.env.ERNIE_MODEL || process.env.DASHSCOPE_MODEL
});

console.log(`AI Provider: ${aiProvider}`);
if (aiProvider === 'mock') {
  console.log('Using mock AI service - no real API calls will be made');
}

const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const collaborationService = new CollaborationService(io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  collaborationService.registerSocket(socket);
});

app.use('/api/mindmap', createMindMapRouter(aiService));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    activeSessions: collaborationService.getActiveSessions()
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
