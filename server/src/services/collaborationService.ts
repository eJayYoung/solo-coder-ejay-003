import { Server as SocketIOServer, Socket } from 'socket.io';
import { MindMapData } from '../types';

interface CollaborativeSession {
  mindMapId: string;
  data: MindMapData | null;
  users: Map<string, { socketId: string; userId: string; name: string }>;
  lastActiveTime: number;
}

const SESSION_TTL = 60 * 60 * 1000;

export class CollaborationService {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.startCleanupJob();
  }

  private startCleanupJob() {
    setInterval(() => {
      const now = Date.now();
      for (const [mindMapId, session] of this.sessions.entries()) {
        if (session.users.size === 0 && now - session.lastActiveTime > SESSION_TTL) {
          this.sessions.delete(mindMapId);
          console.log(`Cleaned up inactive session: ${mindMapId}`);
        }
      }
    }, 5 * 60 * 1000);
  }

  registerSocket(socket: Socket) {
    socket.on('join-session', (data: { mindMapId: string; userId: string; name: string }) => {
      this.handleJoinSession(socket, data);
    });

    socket.on('leave-session', (data: { mindMapId: string }) => {
      this.handleLeaveSession(socket, data);
    });

    socket.on('update-mindmap', (data: { mindMapId: string; mindMapData: MindMapData }) => {
      this.handleUpdateMindMap(socket, data);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinSession(
    socket: Socket,
    data: { mindMapId: string; userId: string; name: string }
  ) {
    const { mindMapId, userId, name } = data;

    let session = this.sessions.get(mindMapId);
    if (!session) {
      session = {
        mindMapId,
        data: null,
        users: new Map(),
        lastActiveTime: Date.now()
      };
      this.sessions.set(mindMapId, session);
      console.log(`Created new session: ${mindMapId}`);
    }

    session.lastActiveTime = Date.now();
    socket.join(mindMapId);
    session.users.set(socket.id, { socketId: socket.id, userId, name });

    const users = Array.from(session.users.values()).map(u => ({
      userId: u.userId,
      name: u.name,
      socketId: u.socketId
    }));

    socket.emit('session-joined', {
      mindMapId,
      users,
      mindMapData: session.data
    });

    socket.to(mindMapId).emit('user-joined', {
      userId,
      name,
      socketId: socket.id,
      users
    });

    console.log(`User ${name} (${userId}) joined session ${mindMapId}. Session has data: ${session.data !== null}`);
  }

  private handleLeaveSession(
    socket: Socket,
    data: { mindMapId: string }
  ) {
    const { mindMapId } = data;
    const session = this.sessions.get(mindMapId);

    if (session) {
      const user = session.users.get(socket.id);
      session.users.delete(socket.id);
      socket.leave(mindMapId);
      session.lastActiveTime = Date.now();

      const remainingUsers = Array.from(session.users.values()).map(u => ({
        userId: u.userId,
        name: u.name,
        socketId: u.socketId
      }));

      socket.to(mindMapId).emit('user-left', {
        userId: user?.userId,
        name: user?.name,
        socketId: socket.id,
        users: remainingUsers
      });

      if (user) {
        console.log(`User ${user.name} left session ${mindMapId}. Remaining users: ${session.users.size}`);
      }
    }
  }

  private handleUpdateMindMap(
    socket: Socket,
    data: { mindMapId: string; mindMapData: MindMapData }
  ) {
    const { mindMapId, mindMapData } = data;
    const session = this.sessions.get(mindMapId);

    if (session) {
      session.data = mindMapData;
      socket.to(mindMapId).emit('mindmap-updated', {
        mindMapData,
        updatedBy: socket.id
      });
    }
  }

  private handleDisconnect(socket: Socket) {
    for (const [mindMapId, session] of this.sessions.entries()) {
      if (session.users.has(socket.id)) {
        this.handleLeaveSession(socket, { mindMapId });
      }
    }
  }

  getSession(mindMapId: string): CollaborativeSession | undefined {
    return this.sessions.get(mindMapId);
  }

  getActiveSessions(): number {
    return this.sessions.size;
  }
}
