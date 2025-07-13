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

export interface Model {
  id?: number;
  name: string;
  provider: string;
  type: string;
  config: string;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

class DatabaseService {
  private db: Database | null = null;

  async init() {
    if (!this.db) {
      this.db = await Database.load("sqlite:seekchat.db");
    }
    return this.db;
  }

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
    // 获取新插入的 id
    const result = await db.select("SELECT last_insert_rowid() as id");
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

    return message;
  }

  async getActiveMcpServers(): Promise<McpServer[]> {
    const db = await this.init();
    const result = await db.select(
      "SELECT * FROM mcp_servers WHERE active = 1 ORDER BY created_at DESC"
    );
    return result as McpServer[];
  }

  async getModels(): Promise<Model[]> {
    const db = await this.init();
    const result = await db.select("SELECT * FROM models WHERE enabled = 1");
    return result as Model[];
  }

  async updateAllPendingMessagesToError(): Promise<{ updatedCount: number }> {
    const db = await this.init();
    const now = Date.now();
    const errorContent = JSON.stringify([
      { type: "content", text: "页面刷新导致请求中断", status: "error" },
    ]);
    // 查询所有 pending 消息
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
}

export const databaseService = new DatabaseService();
