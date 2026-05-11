import { AIProvider, MindMapData, MindMapNode, MindMapEdge } from './types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface AIProviderConfig {
  type: AIProvider;
  apiKey?: string;
  model?: string;
  secretKey?: string;
}

export class AIService {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async generateMindMap(topic: string): Promise<MindMapData> {
    if (this.config.type === 'mock') {
      return this.generateMockMindMap(topic);
    }

    try {
      const prompt = this.buildPrompt(topic);
      const aiResponse = await this.callAI(prompt);
      return this.parseAIResponse(aiResponse, topic);
    } catch (error) {
      console.error('AI generation failed, using fallback mock data:', error);
      return this.generateMockMindMap(topic);
    }
  }

  private buildPrompt(topic: string): string {
    return `请为主题"${topic}"生成一个思维导图结构，要求：

1. 包含 1 个中心主题节点
2. 3-5 个主要分支节点
3. 每个主要分支下有 2-4 个子节点

请以 JSON 格式输出，格式如下：
{
  "title": "思维导图标题",
  "nodes": [
    {"id": "node-1", "label": "节点内容", "type": "root"}
  ],
  "edges": [
    {"id": "edge-1", "source": "node-1", "target": "node-2"}
  ]
}

节点类型：root（中心）、branch（主分支）、leaf（叶子节点）
只输出 JSON，不要其他文字。`;
  }

  private async callAI(prompt: string): Promise<string> {
    switch (this.config.type) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'ernie':
        return this.callErnie(prompt);
      case 'dashscope':
        return this.callDashscope(prompt);
      default:
        throw new Error('Unknown AI provider');
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  }

  private async callErnie(prompt: string): Promise<string> {
    const accessToken = await this.getErnieAccessToken();
    const response = await axios.post(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${this.config.model || 'ernie-3.5'}?access_token=${accessToken}`,
      {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data.result;
  }

  private async getErnieAccessToken(): Promise<string> {
    const response = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: this.config.apiKey,
          client_secret: this.config.secretKey
        }
      }
    );
    return response.data.access_token;
  }

  private async callDashscope(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: this.config.model || 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  }

  private parseAIResponse(content: string, topic: string): MindMapData {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: uuidv4(),
        title: parsed.title || topic,
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.generateMockMindMap(topic);
    }
  }

  private generateMockMindMap(topic: string): MindMapData {
    const mainBranches = [
      '概念定义',
      '核心特点',
      '应用场景',
      '发展趋势',
      '挑战与机遇'
    ];

    const branchDetails: Record<string, string[]> = {
      '概念定义': ['基本含义', '历史起源', '核心内涵', '相关术语'],
      '核心特点': ['主要优势', '独特价值', '技术原理', '关键要素'],
      '应用场景': ['行业应用', '实际案例', '典型用户', '使用方法'],
      '发展趋势': ['未来方向', '技术演进', '市场预测', '创新机会'],
      '挑战与机遇': ['主要挑战', '解决方案', '发展机遇', '行动计划']
    };

    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];

    const rootId = uuidv4();
    nodes.push({
      id: rootId,
      label: topic,
      type: 'root'
    });

    const branchCount = Math.min(5, mainBranches.length);
    const usedBranches = mainBranches.slice(0, branchCount);

    usedBranches.forEach((branchLabel, branchIndex) => {
      const branchId = uuidv4();
      nodes.push({
        id: branchId,
        label: branchLabel,
        type: 'branch',
        parentId: rootId
      });
      edges.push({
        id: uuidv4(),
        source: rootId,
        target: branchId
      });

      const details = branchDetails[branchLabel] || ['子节点1', '子节点2', '子节点3'];
      details.slice(0, 3).forEach((detailLabel) => {
        const leafId = uuidv4();
        nodes.push({
          id: leafId,
          label: detailLabel,
          type: 'leaf',
          parentId: branchId
        });
        edges.push({
          id: uuidv4(),
          source: branchId,
          target: leafId
        });
      });
    });

    return {
      id: uuidv4(),
      title: topic,
      nodes,
      edges,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}
