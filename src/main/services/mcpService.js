import { v4 as uuidv4 } from "uuid";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// 数据库实例将通过全局引用获取
let _db;

// 创建MCP客户端
const createMCPClient = async (serverData) => {
  try {
    // 创建客户端配置
    const clientConfig = {
      name: "seekchat-client",
      version: "1.0.0",
    };

    // 创建客户端能力设置
    const clientCapabilities = {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    };

    // 创建客户端
    const client = new Client(clientConfig, clientCapabilities);

    // 根据服务器类型创建不同的传输
    let transport;

    if (serverData.type === "stdio") {
      // 解析命令行和参数
      const urlParts = serverData.url.split(" ");
      const command = urlParts[0];
      const args = urlParts.slice(1);

      // 创建stdio传输
      transport = new StdioClientTransport({
        command,
        args,
        env: serverData.apiKey ? { MCP_API_KEY: serverData.apiKey } : undefined,
      });
    } else if (serverData.type === "sse") {
      // 创建SSE传输
      transport = new SSEClientTransport({
        baseUrl: serverData.url,
        headers: serverData.apiKey
          ? { Authorization: `Bearer ${serverData.apiKey}` }
          : undefined,
      });
    } else {
      throw new Error(`不支持的MCP服务器类型：${serverData.type}`);
    }

    // 连接客户端
    await client.connect(transport);

    return client;
  } catch (error) {
    console.error("创建MCP客户端失败:", error);
    throw error;
  }
};

// 测试MCP服务器连接
const testMCPConnection = async (serverData) => {
  try {
    // 基本URL验证
    if (
      serverData.type === "sse" &&
      (!serverData.url || !serverData.url.startsWith("http"))
    ) {
      return {
        success: false,
        message: "无效的URL格式",
        tools: [],
      };
    }

    let client = null;
    try {
      // 创建MCP客户端
      client = await createMCPClient(serverData);

      // 获取工具列表
      const tools = await client.listTools();

      // 格式化工具列表
      const formattedTools = tools.tools.map((tool) => ({
        id: tool.name,
        name: tool.name,
        description: tool.description || "",
        parameters: tool.arguments,
      }));

      // 如果有服务器ID，更新服务器的工具信息
      if (serverData.id && _db) {
        await _db.updateMCPServerTools(serverData.id, formattedTools);
      }

      return {
        success: true,
        message: "连接成功",
        tools: formattedTools,
      };
    } catch (error) {
      console.error("列出工具失败:", error);
      return {
        success: false,
        message: `列出工具失败: ${error.message}`,
        tools: [],
      };
    } finally {
      // 关闭客户端连接
      if (client && client.disconnect) {
        try {
          await client.disconnect();
        } catch (e) {
          console.error("关闭MCP客户端连接失败:", e);
        }
      }
    }
  } catch (error) {
    console.error("测试MCP连接失败:", error);
    return {
      success: false,
      message: `连接失败: ${error.message}`,
      tools: [],
    };
  }
};

// 初始化MCP模块
const initMCP = (db) => {
  _db = db;
};

export { createMCPClient, testMCPConnection, initMCP };
