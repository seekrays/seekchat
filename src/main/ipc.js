const { ipcMain } = require("electron");
let mcpService = null; // 将通过动态导入加载

// 包装 IPC 处理器，确保数据库已初始化
function wrapDbHandler(handler) {
  return async (event, ...args) => {
    try {
      // database实例会通过registerIpcHandlers传入
      const database = this.db;
      if (!database) {
        throw new Error("数据库未初始化");
      }
      return await handler(database, ...args);
    } catch (err) {
      console.error("IPC 处理器错误:", err);
      throw err;
    }
  };
}

// 注册所有IPC处理程序
async function registerIpcHandlers(db) {
  // 保存数据库引用
  this.db = db;

  // 动态导入 mcpService
  try {
    mcpService = await import("./services/mcpService.js");

    // 初始化MCP模块
    mcpService.initMCP(db);

    // 注册会话和消息相关的IPC处理程序
    registerSessionMessageHandlers();

    // 注册MCP相关的IPC处理程序
    registerMCPHandlers();
  } catch (error) {
    console.error("动态导入 mcpService 失败:", error);
  }
}

// 注册MCP相关的IPC处理程序
function registerMCPHandlers() {
  if (!mcpService) {
    console.error("MCP服务未初始化，无法注册IPC处理程序");
    return;
  }

  // 获取所有MCP服务器
  ipcMain.handle(
    "get-all-mcp-servers",
    wrapDbHandler(async (database) => {
      try {
        return await database.getAllMCPServers();
      } catch (error) {
        console.error("IPC: 获取MCP服务器失败", error);
        throw error;
      }
    })
  );

  // 获取激活的MCP服务器
  ipcMain.handle(
    "get-active-mcp-servers",
    wrapDbHandler(async (database) => {
      try {
        return await database.getActiveMCPServers();
      } catch (error) {
        console.error("IPC: 获取激活的MCP服务器失败", error);
        throw error;
      }
    })
  );

  // 添加MCP服务器
  ipcMain.handle(
    "add-mcp-server",
    wrapDbHandler(async (database, serverData) => {
      try {
        return await database.addMCPServer(serverData);
      } catch (error) {
        console.error("IPC: 添加MCP服务器失败", error);
        throw error;
      }
    })
  );

  // 更新MCP服务器
  ipcMain.handle(
    "update-mcp-server",
    wrapDbHandler(async (database, id, updates) => {
      try {
        return await database.updateMCPServer(id, updates);
      } catch (error) {
        console.error("IPC: 更新MCP服务器失败", error);
        throw error;
      }
    })
  );

  // 删除MCP服务器
  ipcMain.handle(
    "delete-mcp-server",
    wrapDbHandler(async (database, id) => {
      try {
        return await database.deleteMCPServer(id);
      } catch (error) {
        console.error("IPC: 删除MCP服务器失败", error);
        throw error;
      }
    })
  );

  // 设置MCP服务器激活状态
  ipcMain.handle(
    "set-mcp-server-active",
    wrapDbHandler(async (database, id, active) => {
      try {
        return await database.setMCPServerActive(id, active);
      } catch (error) {
        console.error("IPC: 设置MCP服务器激活状态失败", error);
        throw error;
      }
    })
  );

  // 测试MCP服务器连接
  ipcMain.handle(
    "test-mcp-connection",
    wrapDbHandler(async (database, serverData) => {
      try {
        return await mcpService.testMCPConnection(serverData);
      } catch (error) {
        console.error("IPC: 测试MCP连接失败", error);
        return {
          success: false,
          message: `连接失败: ${error.message}`,
          tools: [],
        };
      }
    })
  );

  // 执行MCP工具
  ipcMain.handle(
    "execute-mcp-tool",
    wrapDbHandler(async (database, serverId, toolId, parameters) => {
      try {
        return await mcpService.executeTool(serverId, toolId, parameters);
      } catch (error) {
        console.error("IPC: 执行MCP工具失败", error);
        return {
          success: false,
          message: `执行工具失败: ${error.message}`,
          result: null,
        };
      }
    })
  );

  // 添加工具调用记录
  ipcMain.handle(
    "add-mcp-tool-call",
    wrapDbHandler(async (database, toolCallData) => {
      try {
        return await database.addMCPToolCall(toolCallData);
      } catch (error) {
        console.error("IPC: 添加工具调用记录失败", error);
        throw error;
      }
    })
  );

  // 更新工具调用结果
  ipcMain.handle(
    "update-mcp-tool-call-result",
    wrapDbHandler(async (database, id, result, status) => {
      try {
        return await database.updateMCPToolCallResult(id, result, status);
      } catch (error) {
        console.error("IPC: 更新工具调用结果失败", error);
        throw error;
      }
    })
  );

  // 获取消息的工具调用记录
  ipcMain.handle(
    "get-mcp-tool-calls-by-message",
    wrapDbHandler(async (database, messageId) => {
      try {
        return await database.getMCPToolCallsByMessageId(messageId);
      } catch (error) {
        console.error("IPC: 获取消息工具调用记录失败", error);
        throw error;
      }
    })
  );
}

// 注册会话和消息相关的IPC处理程序
function registerSessionMessageHandlers() {
  // 获取所有会话
  ipcMain.handle(
    "get-sessions",
    wrapDbHandler(async (database) => {
      console.log("main进程: 获取所有会话");
      return await database.getAllSessions();
    })
  );

  // 创建新会话
  ipcMain.handle(
    "create-session",
    wrapDbHandler(async (database, name) => {
      console.log("main进程: 创建会话", name);
      return await database.createSession(name);
    })
  );

  // 获取会话消息
  ipcMain.handle(
    "get-messages",
    wrapDbHandler(async (database, sessionId) => {
      console.log("main进程: 获取会话消息", sessionId);
      return await database.getMessages(sessionId);
    })
  );

  // 删除会话消息
  ipcMain.handle(
    "delete-messages",
    wrapDbHandler(async (database, sessionId) => {
      console.log("main进程: 删除会话消息", sessionId);
      return await database.deleteMessages(sessionId);
    })
  );

  // 添加消息
  ipcMain.handle(
    "add-message",
    wrapDbHandler(async (database, message) => {
      console.log("main进程: 即将添加消息");
      const result = await database.addMessage(message);
      console.log("main进程: 添加消息成功, ID:", result.id);
      return result;
    })
  );

  // 更新消息状态
  ipcMain.handle(
    "update-message-status",
    wrapDbHandler(async (database, id, status) => {
      console.log("main进程: 即将更新消息状态, ID:", id);
      const result = await database.updateMessageStatus(id, status);
      console.log("main进程: 更新消息状态成功");
      return result;
    })
  );

  // 更新消息内容
  ipcMain.handle(
    "update-message-content",
    wrapDbHandler(async (database, id, content) => {
      console.log("main进程: 即将更新消息内容, ID:", id);
      const result = await database.updateMessageContent(id, content);
      console.log("main进程: 更新消息内容成功");
      return result;
    })
  );

  // 删除会话
  ipcMain.handle(
    "delete-session",
    wrapDbHandler(async (database, id) => {
      console.log("main进程: 即将删除会话", id);
      const result = await database.deleteSession(id);
      console.log("main进程: 删除会话成功");
      return result;
    })
  );

  // 创建或更新消息
  ipcMain.handle(
    "create-or-update-message",
    wrapDbHandler(async (database, message) => {
      console.log(
        "main进程: 即将创建或更新消息",
        message.id ? `ID: ${message.id}` : "新消息"
      );
      const result = await database.createOrUpdateMessage(message);
      console.log("main进程: 创建或更新消息成功, ID:", result.id);
      return result;
    })
  );

  // 更新会话元数据
  ipcMain.handle(
    "update-session-metadata",
    wrapDbHandler(async (database, sessionId, metadata) => {
      console.log("main进程: 即将更新会话元数据, ID:", sessionId);
      const result = await database.updateSessionMetadata(sessionId, metadata);
      console.log("main进程: 更新会话元数据成功");
      return result;
    })
  );

  // 更新会话名称
  ipcMain.handle(
    "update-session-name",
    wrapDbHandler(async (database, sessionId, name) => {
      console.log("main进程: 即将更新会话名称, ID:", sessionId);
      const result = await database.updateSessionName(sessionId, name);
      console.log("main进程: 更新会话名称成功");
      return result;
    })
  );
}

module.exports = {
  registerIpcHandlers,
};
