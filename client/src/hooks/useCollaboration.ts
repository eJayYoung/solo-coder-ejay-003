import { useEffect, useCallback, useRef } from 'react';
import { MindMapData, Collaborator } from '../types';
import { collaborationService } from '../services/collaborationService';
import { useMindMapStore } from '../store/mindMapStore';

export function useCollaboration(
  sessionId: string | null,
  userId: string,
  userName: string
) {
  const {
    mindMapData,
    setMindMapData,
    setCollaborators,
    setIsCollaborating
  } = useMindMapStore();

  const lastSentDataRef = useRef<string>('');

  useEffect(() => {
    if (!sessionId) return;

    collaborationService.connect();

    collaborationService.setCallbacks({
      onSessionJoined: (data) => {
        setCollaborators(data.users);
        setIsCollaborating(true);
        if (data.mindMapData) {
          setMindMapData(data.mindMapData);
        }
      },
      onUserJoined: (data) => {
        setCollaborators(data.users);
      },
      onUserLeft: (data) => {
        setCollaborators(data.users);
      },
      onMindMapUpdated: (data) => {
        const newDataStr = JSON.stringify(data.mindMapData);
        if (newDataStr !== lastSentDataRef.current) {
          setMindMapData(data.mindMapData);
        }
      }
    });

    collaborationService.joinSession(sessionId, userId, userName);

    return () => {
      collaborationService.leaveSession(sessionId);
      setIsCollaborating(false);
    };
  }, [sessionId, userId, userName, setMindMapData, setCollaborators, setIsCollaborating]);

  const syncData = useCallback(
    (data: MindMapData) => {
      if (sessionId) {
        const dataStr = JSON.stringify(data);
        lastSentDataRef.current = dataStr;
        collaborationService.updateMindMap(sessionId, data);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (sessionId && mindMapData) {
      const dataStr = JSON.stringify(mindMapData);
      if (dataStr !== lastSentDataRef.current) {
        lastSentDataRef.current = dataStr;
        collaborationService.updateMindMap(sessionId, mindMapData);
      }
    }
  }, [sessionId, mindMapData]);

  return {
    syncData,
    joinSession: (id: string) => {
      if (id) {
        collaborationService.joinSession(id, userId, userName);
      }
    }
  };
}
