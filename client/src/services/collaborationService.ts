import { io, Socket } from 'socket.io-client';
import { MindMapData, Collaborator } from '../types';

interface CollaborationCallbacks {
  onSessionJoined?: (data: {
    mindMapId: string;
    users: Collaborator[];
    mindMapData: MindMapData | null;
  }) => void;
  onUserJoined?: (data: {
    userId: string;
    name: string;
    socketId: string;
    users: Collaborator[];
  }) => void;
  onUserLeft?: (data: {
    userId: string;
    name: string;
    socketId: string;
    users: Collaborator[];
  }) => void;
  onMindMapUpdated?: (data: {
    mindMapData: MindMapData;
    updatedBy: string;
  }) => void;
}

export class CollaborationService {
  private socket: Socket | null = null;
  private callbacks: CollaborationCallbacks = {};

  connect() {
    if (this.socket?.connected) return;
    this.socket = io('/', {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
    });

    this.socket.on('session-joined', (data) => {
      this.callbacks.onSessionJoined?.(data);
    });

    this.socket.on('user-joined', (data) => {
      this.callbacks.onUserJoined?.(data);
    });

    this.socket.on('user-left', (data) => {
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on('mindmap-updated', (data) => {
      this.callbacks.onMindMapUpdated?.(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSession(mindMapId: string, userId: string, name: string) {
    if (!this.socket?.connected) {
      this.connect();
    }
    this.socket?.emit('join-session', { mindMapId, userId, name });
  }

  leaveSession(mindMapId: string) {
    this.socket?.emit('leave-session', { mindMapId });
  }

  updateMindMap(mindMapId: string, mindMapData: MindMapData) {
    this.socket?.emit('update-mindmap', { mindMapId, mindMapData });
  }

  setCallbacks(callbacks: CollaborationCallbacks) {
    this.callbacks = callbacks;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const collaborationService = new CollaborationService();
