const { contextBridge, ipcRenderer } = require("electron");

// 用于调试
console.log("Preload script loaded successfully!");

// 安全地包装 IPC 调用，添加错误处理
function safeIpcCall(channel, ...args) {
  try {
    return ipcRenderer.invoke(channel, ...args).catch((error) => {
      console.error(`IPC 调用 ${channel} 失败:`, error);
      throw error;
    });
  } catch (error) {
    console.error(`无法调用 IPC ${channel}:`, error);
    throw error;
  }
}

// 确保 API 在 window 对象上可用
contextBridge.exposeInMainWorld("electronAPI", {
  // 会话相关
  getSessions: () => safeIpcCall("get-sessions"),
  createSession: (name) => safeIpcCall("create-session", name),
  deleteSession: (id) => safeIpcCall("delete-session", id),
  updateSessionMetadata: (sessionId, metadata) =>
    safeIpcCall("update-session-metadata", sessionId, metadata),
  updateSessionName: (sessionId, name) =>
    safeIpcCall("update-session-name", sessionId, name),

  // 消息相关
  getMessages: (sessionId) => safeIpcCall("get-messages", sessionId),
  deleteMessages: (sessionId) => safeIpcCall("delete-messages", sessionId),
  addMessage: (message) => safeIpcCall("add-message", message),
  updateMessageStatus: (id, status) =>
    safeIpcCall("update-message-status", id, status),
  updateMessageContent: (id, content) =>
    safeIpcCall("update-message-content", id, content),
  createOrUpdateMessage: (message) =>
    safeIpcCall("create-or-update-message", message),

  // 数据库事件
  onDatabaseError: (callback) => {
    ipcRenderer.on("db-error", (_, message) => callback(message));
    return () => ipcRenderer.removeListener("db-error", callback);
  },
});
