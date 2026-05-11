import { MindMapData } from '../types';

const API_BASE = '/api';

export async function generateMindMap(topic: string): Promise<MindMapData> {
  const response = await fetch(`${API_BASE}/mindmap/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ topic })
  });

  if (!response.ok) {
    throw new Error('生成思维导图失败');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '生成失败');
  }

  return result.data;
}
