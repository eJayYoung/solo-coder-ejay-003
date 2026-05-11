import express from 'express';
import { Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { AIProvider } from '../types';

export function createMindMapRouter(aiService: AIService) {
  const router = express.Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const { topic } = req.body;

      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '请提供有效的主题'
        });
      }

      const mindMapData = await aiService.generateMindMap(topic.trim());

      res.json({
        success: true,
        data: mindMapData
      });
    } catch (error) {
      console.error('Failed to generate mind map:', error);
      res.status(500).json({
        success: false,
        error: '生成思维导图失败，请稍后重试'
      });
    }
  });

  return router;
}
