export interface MindMapNode {
  id: string;
  label: string;
  type?: 'root' | 'branch' | 'leaf';
  parentId?: string;
  x?: number;
  y?: number;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface MindMapData {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark' | 'ocean' | 'forest';

export interface ThemeConfig {
  name: string;
  bg: string;
  nodeBg: string;
  nodeBgRoot: string;
  nodeBgBranch: string;
  nodeBgLeaf: string;
  nodeText: string;
  nodeBorder: string;
  edgeColor: string;
  toolbarBg: string;
  text: string;
  inputBg: string;
  buttonBg: string;
  buttonHoverBg: string;
}

export const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    name: '明亮',
    bg: '#f8fafc',
    nodeBg: '#ffffff',
    nodeBgRoot: '#3b82f6',
    nodeBgBranch: '#60a5fa',
    nodeBgLeaf: '#93c5fd',
    nodeText: '#1e293b',
    nodeBorder: '#e2e8f0',
    edgeColor: '#94a3b8',
    toolbarBg: '#ffffff',
    text: '#1e293b',
    inputBg: '#f1f5f9',
    buttonBg: '#3b82f6',
    buttonHoverBg: '#2563eb'
  },
  dark: {
    name: '暗黑',
    bg: '#0f172a',
    nodeBg: '#1e293b',
    nodeBgRoot: '#6366f1',
    nodeBgBranch: '#818cf8',
    nodeBgLeaf: '#a5b4fc',
    nodeText: '#f1f5f9',
    nodeBorder: '#334155',
    edgeColor: '#475569',
    toolbarBg: '#1e293b',
    text: '#f1f5f9',
    inputBg: '#334155',
    buttonBg: '#6366f1',
    buttonHoverBg: '#4f46e5'
  },
  ocean: {
    name: '海洋',
    bg: '#0c4a6e',
    nodeBg: '#075985',
    nodeBgRoot: '#0ea5e9',
    nodeBgBranch: '#38bdf8',
    nodeBgLeaf: '#7dd3fc',
    nodeText: '#f0f9ff',
    nodeBorder: '#0369a1',
    edgeColor: '#38bdf8',
    toolbarBg: '#075985',
    text: '#f0f9ff',
    inputBg: '#0369a1',
    buttonBg: '#0ea5e9',
    buttonHoverBg: '#0284c7'
  },
  forest: {
    name: '森林',
    bg: '#14532d',
    nodeBg: '#166534',
    nodeBgRoot: '#22c55e',
    nodeBgBranch: '#4ade80',
    nodeBgLeaf: '#86efac',
    nodeText: '#f0fdf4',
    nodeBorder: '#15803d',
    edgeColor: '#22c55e',
    toolbarBg: '#166534',
    text: '#f0fdf4',
    inputBg: '#15803d',
    buttonBg: '#22c55e',
    buttonHoverBg: '#16a34a'
  }
};

export interface Collaborator {
  userId: string;
  name: string;
  socketId: string;
}
