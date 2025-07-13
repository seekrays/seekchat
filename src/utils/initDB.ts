import load from "@tauri-apps/plugin-sql";

export async function initDB() {
  const db = await load("sqlite");
  // 会话表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      metadata TEXT DEFAULT '',
      updatedAt INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT 0
    );
  `);
  // 消息表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      role TEXT NOT NULL,
      providerId INTEGER NOT NULL,
      modelId INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT '',
      updatedAt INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT 0,
      FOREIGN KEY (sessionId) REFERENCES chat_session(id) ON DELETE CASCADE
    );
  `);
  // MCP服务器表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      active BOOLEAN DEFAULT 0,
      tools TEXT,
      description TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
  // 模型表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      enabled BOOLEAN DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}
