import { databaseService, type McpServer, type Model } from './database';

export interface AiConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface MessageRequest {
  role: string;
  content: string;
  model: string;
}

export interface MessageResponse {
  role: string;
  content: string;
  error?: string;
}

class AiService {
  private activeServer: McpServer | null = null;
  private activeModel: Model | null = null;

  async init() {
    try {
      const servers = await databaseService.getActiveMcpServers();
      if (servers.length > 0) {
        this.activeServer = servers[0];
      }

      const models = await databaseService.getModels();
      if (models.length > 0) {
        this.activeModel = models[0];
      }
    } catch (error) {
      console.error('初始化AI服务失败:', error);
    }
  }

  async sendMessage(message: MessageRequest): Promise<MessageResponse> {
    if (!this.activeServer || !this.activeModel) {
      throw new Error('未配置AI服务或模型');
    }

    try {
      // TODO: 实现实际的API调用
      // 这里是一个模拟的响应
      return {
        role: 'assistant',
        content: '这是一个示例回复，需要替换为实际的API调用。',
      };
    } catch (error) {
      console.error('发送消息到AI服务失败:', error);
      throw error;
    }
  }

  async setActiveServer(server: McpServer) {
    this.activeServer = server;
  }

  async setActiveModel(model: Model) {
    this.activeModel = model;
  }

  getActiveServer() {
    return this.activeServer;
  }

  getActiveModel() {
    return this.activeModel;
  }
}

export const aiService = new AiService();