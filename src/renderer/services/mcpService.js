// 使用暴露在window.electronAPI上的安全IPC调用

/**
 * MCP 服务渲染进程接口
 */
class MCPService {
  /**
   * 获取所有MCP服务器
   * @returns {Promise<Array>} MCP服务器列表
   */
  async getAllServers() {
    try {
      // 直接调用mcp-ipc处理
      return window.electronAPI.invokeMCP("get-all-mcp-servers");
    } catch (error) {
      console.error("获取MCP服务器列表失败:", error);
      return [];
    }
  }

  /**
   * 获取所有激活的MCP服务器
   * @returns {Promise<Array>} 激活的MCP服务器列表
   */
  async getActiveServers() {
    try {
      return window.electronAPI.invokeMCP("get-active-mcp-servers");
    } catch (error) {
      console.error("获取激活的MCP服务器列表失败:", error);
      return [];
    }
  }

  /**
   * 添加MCP服务器
   * @param {Object} serverData 服务器数据
   * @returns {Promise<Object>} 新添加的服务器
   */
  async addServer(serverData) {
    return window.electronAPI.invokeMCP("add-mcp-server", serverData);
  }

  /**
   * 更新MCP服务器
   * @param {string} id 服务器ID
   * @param {Object} updates 更新数据
   * @returns {Promise<Object>} 更新后的服务器
   */
  async updateServer(id, updates) {
    return window.electronAPI.invokeMCP("update-mcp-server", id, updates);
  }

  /**
   * 删除MCP服务器
   * @param {string} id 服务器ID
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteServer(id) {
    return window.electronAPI.invokeMCP("delete-mcp-server", id);
  }

  /**
   * 设置MCP服务器激活状态
   * @param {string} id 服务器ID
   * @param {boolean} active 激活状态
   * @returns {Promise<Object>} 更新后的服务器
   */
  async setServerActive(id, active) {
    return window.electronAPI.invokeMCP("set-mcp-server-active", id, active);
  }

  /**
   * 测试MCP服务器连接
   * @param {Object} serverData 服务器数据
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection(serverData) {
    return window.electronAPI.invokeMCP("test-mcp-connection", serverData);
  }

  /**
   * 添加工具调用记录
   * @param {Object} toolCallData 工具调用数据
   * @returns {Promise<string>} 调用记录ID
   */
  async addToolCall(toolCallData) {
    return window.electronAPI.invokeMCP("add-mcp-tool-call", toolCallData);
  }

  /**
   * 更新工具调用结果
   * @param {string} id 调用记录ID
   * @param {Object} result 结果数据
   * @param {string} status 状态
   * @returns {Promise<boolean>} 是否成功
   */
  async updateToolCallResult(id, result, status) {
    return window.electronAPI.invokeMCP(
      "update-mcp-tool-call-result",
      id,
      result,
      status
    );
  }

  /**
   * 获取消息的工具调用记录
   * @param {string} messageId 消息ID
   * @returns {Promise<Array>} 工具调用记录
   */
  async getToolCallsByMessage(messageId) {
    return window.electronAPI.invokeMCP(
      "get-mcp-tool-calls-by-message",
      messageId
    );
  }

  /**
   * 执行MCP工具
   * @param {string} serverId 服务器ID
   * @param {string} toolId 工具ID
   * @param {Object} parameters 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeTool(serverId, toolId, parameters) {
    return window.electronAPI.invokeMCP(
      "execute-mcp-tool",
      serverId,
      toolId,
      parameters
    );
  }

  /**
   * 获取所有激活服务器的工具
   * @returns {Promise<Array>} 工具列表，包含服务器信息
   */
  async getAllActiveTools() {
    try {
      const servers = await this.getActiveServers();
      const tools = [];

      // 收集所有激活服务器的工具
      for (const server of servers) {
        if (server.tools && server.tools.length > 0) {
          server.tools.forEach((tool) => {
            tools.push({
              ...tool,
              serverId: server.id,
              serverName: server.name,
              serverType: server.type,
            });
          });
        }
      }

      return tools;
    } catch (error) {
      console.error("获取所有激活工具失败:", error);
      return [];
    }
  }

  /**
   * 调用MCP工具
   * @param {string} serverId 服务器ID
   * @param {string} toolId 工具ID
   * @param {Object} parameters 执行参数
   * @returns {Promise<Object>} 执行结果
   */
  async callTool(serverId, toolId, parameters) {
    return window.electronAPI.invokeMCP(
      "execute-mcp-tool",
      serverId,
      toolId,
      parameters
    );
  }
}

export default new MCPService();
