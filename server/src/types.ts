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

export interface AIMindMapResponse {
  success: boolean;
  data?: MindMapData;
  error?: string;
}

export type AIProvider = 'mock' | 'openai' | 'ernie' | 'dashscope';
