import { create } from 'zustand';
import { MindMapData, Theme, Collaborator } from './types';

interface MindMapState {
  mindMapData: MindMapData | null;
  isGenerating: boolean;
  isCollaborating: boolean;
  currentTheme: Theme;
  collaborators: Collaborator[];
  sessionId: string | null;
  error: string | null;

  setMindMapData: (data: MindMapData | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsCollaborating: (isCollaborating: boolean) => void;
  setCurrentTheme: (theme: Theme) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  setSessionId: (sessionId: string | null) => void;
  setError: (error: string | null) => void;
  updateNode: (nodeId: string, updates: Partial<MindMapData['nodes'][0]>) => void;
  updateNodePositions: (positions: { [nodeId: string]: { x: number; y: number } }) => void;
}

export const useMindMapStore = create<MindMapState>((set) => ({
  mindMapData: null,
  isGenerating: false,
  isCollaborating: false,
  currentTheme: 'light',
  collaborators: [],
  sessionId: null,
  error: null,

  setMindMapData: (data) => set({ mindMapData: data }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsCollaborating: (isCollaborating) => set({ isCollaborating }),
  setCurrentTheme: (currentTheme) => set({ currentTheme }),
  setCollaborators: (collaborators) => set({ collaborators }),
  setSessionId: (sessionId) => set({ sessionId }),
  setError: (error) => set({ error }),

  updateNode: (nodeId, updates) =>
    set((state) => {
      if (!state.mindMapData) return state;
      return {
        mindMapData: {
          ...state.mindMapData,
          nodes: state.mindMapData.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
          updatedAt: Date.now()
        }
      };
    }),

  updateNodePositions: (positions) =>
    set((state) => {
      if (!state.mindMapData) return state;
      return {
        mindMapData: {
          ...state.mindMapData,
          nodes: state.mindMapData.nodes.map((node) => {
            const pos = positions[node.id];
            if (pos) {
              return { ...node, x: pos.x, y: pos.y };
            }
            return node;
          }),
          updatedAt: Date.now()
        }
      };
    })
}));
