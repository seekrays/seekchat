import Database from "@tauri-apps/plugin-sql";

export interface ChatSession {
  id?: number;
  name: string;
  metadata?: string;
  updatedAt: number;
  createdAt: number;
}

export interface ChatMessage {
  id?: number;
  sessionId: number;
  role: string;
  providerId: number;
  modelId: number;
  content: string;
  status?: string;
  updatedAt: number;
  createdAt: number;
}

export interface McpServer {
  id?: number;
  name: string;
  url: string;
  type: string;
  active: boolean;
  tools?: string;
  description?: string;
  created_at: number;
  updated_at: number;
}

export interface Provider {
  id: string;
  name: string;
  logo?: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  models: ProviderModel[];
  isCustom?: boolean;
  description?: string;
}

export interface ProviderModel {
  id: string;
  name: string;
  enabled: boolean;
  deleted?: boolean;
}

// 预置提供商数据
export const SYSTEM_PROVIDERS: Provider[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    enabled: true,
    logo: "/assets/providers/deepseek.png",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        enabled: true,
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek Reasoner",
        enabled: true,
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    enabled: false,
    logo: "/assets/providers/openai.png",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        enabled: true,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o-mini",
        enabled: true,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5-turbo",
        enabled: true,
      },
    ],
  },
  {
    id: "silicon",
    name: "SiliconFlow",
    baseUrl: "https://api.siliconflow.cn/v1",
    apiKey: "",
    enabled: false,
    logo: "/assets/providers/silicon.png",
    models: [
      {
        id: "deepseek-ai/DeepSeek-V3",
        name: "DeepSeek-V3",
        enabled: true,
      },
      {
        id: "Qwen/Qwen2.5-7B-Instruct",
        name: "Qwen2.5-7B-Instruct",
        enabled: true,
      },
    ],
  },
  {
    id: "moonshot",
    name: "月之暗面",
    baseUrl: "https://api.moonshot.cn/v1",
    apiKey: "",
    enabled: false,
    logo: "/assets/providers/moonshot.png",
    models: [
      {
        id: "moonshot-v1-8k",
        name: "Moonshot v1 8K",
        enabled: true,
      },
      {
        id: "moonshot-v1-32k",
        name: "Moonshot v1 32K",
        enabled: true,
      },
    ],
  },
  {
    id: "dashscope",
    name: "阿里云百炼",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: "",
    enabled: false,
    logo: "/assets/providers/dashscope.png",
    models: [
      {
        id: "qwen-turbo",
        name: "通义千问-turbo",
        enabled: true,
      },
      {
        id: "qwen-plus",
        name: "通义千问-plus",
        enabled: true,
      },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    apiKey: "",
    enabled: false,
    logo: "/assets/providers/ollama.png",
    models: [],
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    apiKey: "",
    enabled: false,
    logo: "/assets/providers/lmstudio.png",
    models: [],
  },
];

class DatabaseService {
  private db: Database | null = null;
  private providers: Provider[] = [];

  async init() {
    if (!this.db) {
      this.db = await Database.load("sqlite:seekchat.db");
      await this.initTables();
      await this.initProviders();
    }
    return this.db;
  }

  private async initTables() {
    const db = await this.init();

    // 创建会话表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        metadata TEXT DEFAULT '',
        updatedAt INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT 0
      )
    `);

    // 创建消息表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId INTEGER NOT NULL,
        role TEXT NOT NULL,
        providerId TEXT NOT NULL,
        modelId TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT '',
        updatedAt INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT 0,
        FOREIGN KEY (sessionId) REFERENCES chat_session(id) ON DELETE CASCADE
      )
    `);

    // 创建MCP服务器表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        active BOOLEAN DEFAULT 0,
        tools TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // 检查是否有会话，如果没有则创建一个默认会话
    const sessions = (await db.select(
      "SELECT COUNT(*) as count FROM chat_session"
    )) as Array<{ count: number }>;
    if (sessions.length === 0 || sessions[0].count === 0) {
      await this.createSession("新对话");
    }
  }

  private async initProviders() {
    // 从localStorage获取提供商配置
    const savedConfig = this.getProvidersConfig();

    // 初始化系统提供商
    this.providers = JSON.parse(JSON.stringify(SYSTEM_PROVIDERS));

    // 应用保存的配置
    this.providers.forEach((provider) => {
      const savedProvider = savedConfig[provider.id];
      if (savedProvider) {
        provider.enabled = savedProvider.enabled ?? false;
        provider.apiKey = savedProvider.apiKey || "";
        provider.baseUrl = savedProvider.baseUrl || provider.baseUrl;

        // 更新模型状态
        if (savedProvider.models) {
          provider.models.forEach((model) => {
            const savedModel = savedProvider.models.find(
              (m: any) => m.id === model.id
            );
            if (savedModel) {
              model.enabled = savedModel.enabled ?? true;
              model.deleted = savedModel.deleted ?? false;
            }
          });

          // 添加新的自定义模型
          savedProvider.models.forEach((savedModel: any) => {
            const existingModel = provider.models.find(
              (m) => m.id === savedModel.id
            );
            if (!existingModel) {
              provider.models.push({
                id: savedModel.id,
                name: savedModel.name || savedModel.id,
                enabled: savedModel.enabled ?? true,
                deleted: savedModel.deleted ?? false,
              });
            }
          });
        }
      }
    });

    // 添加自定义提供商
    Object.keys(savedConfig).forEach((providerId) => {
      const providerConfig = savedConfig[providerId];
      if (providerConfig.isCustom) {
        this.providers.push({
          id: providerId,
          name: providerConfig.name,
          baseUrl: providerConfig.baseUrl,
          apiKey: providerConfig.apiKey,
          enabled: providerConfig.enabled ?? false,
          models: (providerConfig.models || []).map((model: any) => ({
            ...model,
            deleted: model.deleted ?? false,
          })),
          isCustom: true,
        });
      }
    });

    // 过滤掉已删除的模型
    this.providers.forEach((provider) => {
      provider.models = provider.models.filter((model) => !model.deleted);
    });
  }

  private getProvidersConfig(): any {
    try {
      const config = localStorage.getItem("providersConfig");
      return config ? JSON.parse(config) : {};
    } catch (error) {
      console.error("Failed to load providers config:", error);
      return {};
    }
  }

  private saveProvidersConfig(config: any): boolean {
    try {
      localStorage.setItem("providersConfig", JSON.stringify(config));
      return true;
    } catch (error) {
      console.error("Failed to save providers config:", error);
      return false;
    }
  }

  // 会话相关方法
  async getSessions(): Promise<ChatSession[]> {
    const db = await this.init();
    const result = await db.select(
      "SELECT * FROM chat_session ORDER BY updatedAt DESC"
    );
    return result as ChatSession[];
  }

  async createSession(name: string): Promise<ChatSession> {
    const db = await this.init();
    const now = Date.now();
    await db.execute(
      "INSERT INTO chat_session (name, metadata, updatedAt, createdAt) VALUES (?, ?, ?, ?)",
      [name, null, now, now]
    );
    const result = (await db.select(
      "SELECT last_insert_rowid() as id"
    )) as Array<{ id: number }>;
    const id = result && result[0] && result[0].id ? result[0].id : undefined;
    return {
      id,
      name,
      updatedAt: now,
      createdAt: now,
    };
  }

  async deleteSession(id: number): Promise<void> {
    const db = await this.init();
    await db.execute("DELETE FROM chat_session WHERE id = ?", [id]);
  }

  async updateSessionName(sessionId: number, name: string): Promise<void> {
    const db = await this.init();
    const now = Date.now();
    await db.execute(
      "UPDATE chat_session SET name = ?, updatedAt = ? WHERE id = ?",
      [name, now, sessionId]
    );
  }

  // 消息相关方法
  async getMessages(sessionId: number): Promise<ChatMessage[]> {
    const db = await this.init();
    const result = await db.select(
      "SELECT * FROM chat_message WHERE sessionId = ? ORDER BY createdAt ASC",
      [sessionId]
    );
    return result as ChatMessage[];
  }

  async createMessage(message: ChatMessage): Promise<ChatMessage> {
    const db = await this.init();
    const now = Date.now();
    message.updatedAt = now;
    message.createdAt = now;

    await db.execute(
      "INSERT INTO chat_message (sessionId, role, providerId, modelId, content, status, updatedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        message.sessionId,
        message.role,
        message.providerId,
        message.modelId,
        message.content,
        message.status || null,
        message.updatedAt,
        message.createdAt,
      ]
    );

    // 更新会话时间
    await db.execute("UPDATE chat_session SET updatedAt = ? WHERE id = ?", [
      now,
      message.sessionId,
    ]);

    return message;
  }

  async updateMessageStatus(id: number, status: string): Promise<void> {
    const db = await this.init();
    const now = Date.now();
    await db.execute(
      "UPDATE chat_message SET status = ?, updatedAt = ? WHERE id = ?",
      [status, now, id]
    );
  }

  async updateMessageContent(id: number, content: string): Promise<void> {
    const db = await this.init();
    const now = Date.now();
    await db.execute(
      "UPDATE chat_message SET content = ?, updatedAt = ? WHERE id = ?",
      [content, now, id]
    );
  }

  async updateAllPendingMessagesToError(): Promise<{ updatedCount: number }> {
    const db = await this.init();
    const now = Date.now();
    const errorContent = JSON.stringify([
      { type: "content", text: "页面刷新导致请求中断", status: "error" },
    ]);

    const rows = (await db.select(
      "SELECT id, content FROM chat_message WHERE status = ?",
      ["pending"]
    )) as { id: number; content: string }[];

    if (!rows.length) return { updatedCount: 0 };

    let updatedCount = 0;
    for (const row of rows) {
      let content = row.content;
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === "string" || !Array.isArray(parsed)) {
          content = errorContent;
        }
      } catch {
        content = errorContent;
      }
      await db.execute(
        "UPDATE chat_message SET status = ?, content = ?, updatedAt = ? WHERE id = ?",
        ["error", content, now, row.id]
      );
      updatedCount++;
    }
    return { updatedCount };
  }

  // 提供商相关方法
  async getAllProviders(): Promise<Provider[]> {
    await this.init();
    return this.providers;
  }

  async getEnabledProviders(): Promise<Provider[]> {
    await this.init();
    return this.providers.filter((provider) => provider.enabled);
  }

  async getProviderById(id: string): Promise<Provider | null> {
    await this.init();
    return this.providers.find((provider) => provider.id === id) || null;
  }

  async createProvider(providerData: Partial<Provider>): Promise<Provider> {
    const id = providerData.id || `custom_${Date.now()}`;
    const provider: Provider = {
      id,
      name: providerData.name || "Custom Provider",
      baseUrl: providerData.baseUrl || "",
      apiKey: providerData.apiKey || "",
      enabled: providerData.enabled ?? false,
      models: providerData.models || [],
      isCustom: true,
    };

    this.providers.push(provider);

    // 保存到localStorage
    const config = this.getProvidersConfig();
    config[id] = {
      ...provider,
      isCustom: true,
    };
    this.saveProvidersConfig(config);

    return provider;
  }

  async updateProvider(provider: Provider): Promise<void> {
    const index = this.providers.findIndex((p) => p.id === provider.id);
    if (index !== -1) {
      this.providers[index] = provider;

      // 保存到localStorage
      const config = this.getProvidersConfig();
      config[provider.id] = {
        ...provider,
        isCustom: provider.isCustom,
      };
      this.saveProvidersConfig(config);
    }
  }

  async deleteProvider(id: string): Promise<void> {
    const index = this.providers.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.providers.splice(index, 1);

      // 从localStorage删除
      const config = this.getProvidersConfig();
      delete config[id];
      this.saveProvidersConfig(config);
    }
  }

  async setActiveProvider(id: string): Promise<void> {
    // 先禁用所有提供商
    this.providers.forEach((provider) => {
      provider.enabled = false;
    });

    // 启用指定提供商
    const provider = this.providers.find((p) => p.id === id);
    if (provider) {
      provider.enabled = true;
    }

    // 保存配置
    const config = this.getProvidersConfig();
    this.providers.forEach((provider) => {
      if (config[provider.id]) {
        config[provider.id].enabled = provider.enabled;
      } else {
        config[provider.id] = {
          ...provider,
          enabled: provider.enabled,
        };
      }
    });
    this.saveProvidersConfig(config);
  }

  // 模型相关方法
  async getProviderModels(providerId: string): Promise<ProviderModel[]> {
    const provider = await this.getProviderById(providerId);
    return provider ? provider.models : [];
  }

  async addModelToProvider(
    providerId: string,
    modelData: Partial<ProviderModel>
  ): Promise<ProviderModel> {
    const provider = await this.getProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const model: ProviderModel = {
      id: modelData.id || `model_${Date.now()}`,
      name: modelData.name || modelData.id || "New Model",
      enabled: modelData.enabled ?? true,
      deleted: false,
    };

    provider.models.push(model);
    await this.updateProvider(provider);

    return model;
  }

  async updateProviderModel(
    providerId: string,
    modelId: string,
    modelData: Partial<ProviderModel>
  ): Promise<void> {
    const provider = await this.getProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const modelIndex = provider.models.findIndex((m) => m.id === modelId);
    if (modelIndex !== -1) {
      provider.models[modelIndex] = {
        ...provider.models[modelIndex],
        ...modelData,
      };
      await this.updateProvider(provider);
    }
  }

  async deleteProviderModel(
    providerId: string,
    modelId: string
  ): Promise<void> {
    const provider = await this.getProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    if (provider.isCustom) {
      // 对于自定义提供商，直接删除模型
      provider.models = provider.models.filter((m) => m.id !== modelId);
    } else {
      // 对于系统提供商，标记为已删除
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        model.deleted = true;
      }
    }

    await this.updateProvider(provider);
  }

  async setActiveModel(providerId: string, modelId: string): Promise<void> {
    const provider = await this.getProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    // 禁用提供商的所有模型
    provider.models.forEach((model) => {
      model.enabled = false;
    });

    // 启用指定模型
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      model.enabled = true;
    }

    await this.updateProvider(provider);
  }

  // MCP服务器相关方法（保持与原有兼容）
  async getActiveMcpServers(): Promise<McpServer[]> {
    const db = await this.init();
    const result = await db.select(
      "SELECT * FROM mcp_servers WHERE active = 1 ORDER BY created_at DESC"
    );
    return result as McpServer[];
  }

  async getAllMcpServers(): Promise<McpServer[]> {
    const db = await this.init();
    const result = await db.select(
      "SELECT * FROM mcp_servers ORDER BY created_at DESC"
    );
    return result as McpServer[];
  }

  async createMcpServer(serverData: Partial<McpServer>): Promise<McpServer> {
    const db = await this.init();
    const now = Date.now();

    await db.execute(
      "INSERT INTO mcp_servers (name, url, type, active, tools, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        serverData.name,
        serverData.url,
        serverData.type,
        serverData.active ? 1 : 0,
        serverData.tools || null,
        serverData.description || "",
        now,
        now,
      ]
    );

    const result = (await db.select(
      "SELECT last_insert_rowid() as id"
    )) as Array<{ id: number }>;
    const id = result && result[0] && result[0].id ? result[0].id : undefined;

    return {
      id,
      name: serverData.name || "",
      url: serverData.url || "",
      type: serverData.type || "",
      active: serverData.active ?? true,
      tools: serverData.tools || "",
      description: serverData.description || "",
      created_at: now,
      updated_at: now,
    };
  }

  async updateMcpServer(server: McpServer): Promise<void> {
    const db = await this.init();
    const now = Date.now();

    await db.execute(
      "UPDATE mcp_servers SET name=?, url=?, type=?, active=?, tools=?, description=?, updated_at=? WHERE id=?",
      [
        server.name,
        server.url,
        server.type,
        server.active ? 1 : 0,
        server.tools || "",
        server.description || "",
        now,
        server.id,
      ]
    );
  }

  async deleteMcpServer(id: number): Promise<void> {
    const db = await this.init();
    await db.execute("DELETE FROM mcp_servers WHERE id = ?", [id]);
  }

  async setActiveMcpServer(id: number): Promise<void> {
    const db = await this.init();
    await db.execute("UPDATE mcp_servers SET active = 1 WHERE id = ?", [id]);
  }
}

export const databaseService = new DatabaseService();
