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
      console.log("获取到的MCP工具列表:", tools);

      // 格式化工具列表，确保参数格式正确
      const formattedTools = tools.tools.map((tool) => {
        console.log(`处理工具 ${tool.name} 的定义:`, tool);
        return {
          id: tool.name,
          name: tool.name,
          description: tool.description || "",
          parameters: tool.arguments || tool.inputSchema || {},
        };
      });

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

// 执行MCP工具
const executeTool = async (serverId, toolId, parameters) => {
  try {
    if (!_db) {
      throw new Error("数据库未初始化");
    }

    // 获取服务器信息
    const server = await _db.getMCPServerById(serverId);
    if (!server) {
      throw new Error(`找不到ID为${serverId}的MCP服务器`);
    }

    // 检查服务器是否激活
    if (!server.active) {
      throw new Error(`MCP服务器'${server.name}'未激活`);
    }

    let client = null;
    try {
      // 创建MCP客户端
      client = await createMCPClient(server);

      // 确保参数是一个对象
      const parsedParameters =
        typeof parameters === "string"
          ? JSON.parse(parameters)
          : parameters || {};

      // 获取工具列表以检查参数格式
      const toolsList = await client.listTools();
      const toolInfo = toolsList.tools.find((tool) => tool.name === toolId);

      if (!toolInfo) {
        throw new Error(`工具 ${toolId} 不存在`);
      }

      console.log(`准备执行工具 ${toolId}，工具定义:`, toolInfo);
      console.log(`参数:`, parsedParameters);

      // 执行工具
      const result = await client.callTool({
        name: toolId,
        arguments: parsedParameters,
      });
      console.log(`工具 ${toolId} 执行结果:`, result);

      return {
        success: true,
        message: "工具执行成功",
        result: result,
      };
    } catch (error) {
      console.error(`执行工具 ${toolId} 失败:`, error);
      return {
        success: false,
        message: `执行工具失败: ${error.message}`,
        result: null,
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
    console.error("执行MCP工具失败:", error);
    return {
      success: false,
      message: `执行工具失败: ${error.message}`,
      result: null,
    };
  }
};

// 初始化MCP模块
const initMCP = (db) => {
  _db = db;
};

export { createMCPClient, testMCPConnection, executeTool, initMCP };
