const {
  StdioClientTransport,
} = require("@modelcontextprotocol/sdk/client/stdio.js");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const logger = require("../logger");
// SSEClientTransport 无法使用require，否则会报错"ERR_REQUIRE_ASYNC_MODULE"，改为动态import的方式
// 在文件顶部添加
const os = require("os");
const path = require("path");

// 判断操作系统类型
const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";
const isWin = process.platform === "win32";

/**
 * 获取增强的PATH环境变量，包含常见工具位置
 * @param {string} originalPath 原始PATH环境变量
 * @returns {string} 增强后的PATH环境变量
 */
const getEnhancedPath = (originalPath) => {
  // 将原始 PATH 按分隔符分割成数组
  const pathSeparator = process.platform === "win32" ? ";" : ":";
  const existingPaths = new Set(
    originalPath.split(pathSeparator).filter(Boolean)
  );
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";

  // 定义要添加的新路径
  const newPaths = [];

  if (isMac) {
    newPaths.push(
      "/bin",
      "/usr/bin",
      "/usr/local/bin",
      "/usr/local/sbin",
      "/opt/homebrew/bin",
      "/opt/homebrew/sbin",
      "/usr/local/opt/node/bin",
      `${homeDir}/.nvm/current/bin`,
      `${homeDir}/.npm-global/bin`,
      `${homeDir}/.yarn/bin`,
      `${homeDir}/.cargo/bin`,
      "/opt/local/bin"
    );
  }

  if (isLinux) {
    newPaths.push(
      "/bin",
      "/usr/bin",
      "/usr/local/bin",
      `${homeDir}/.nvm/current/bin`,
      `${homeDir}/.npm-global/bin`,
      `${homeDir}/.yarn/bin`,
      `${homeDir}/.cargo/bin`,
      "/snap/bin"
    );
  }

  if (isWin) {
    newPaths.push(
      `${process.env.APPDATA}\\npm`,
      `${homeDir}\\AppData\\Local\\Yarn\\bin`,
      `${homeDir}\\.cargo\\bin`
    );
  }

  // 添加应用内部的node_modules/.bin目录
  newPaths.push(path.join(__dirname, "..", "..", "node_modules", ".bin"));

  // 只添加不存在的路径
  newPaths.forEach((p) => {
    if (p && !existingPaths.has(p)) {
      existingPaths.add(p);
    }
  });

  // 转换回字符串
  return Array.from(existingPaths).join(pathSeparator);
};
// 数据库实例将通过全局引用获取
let _db = null;

// 客户端连接池，用于管理所有MCP客户端实例
const clientPool = new Map();

/**
 * 获取或创建MCP客户端
 * @param {string} serverId 服务器ID
 * @returns {Promise<Client>} MCP客户端实例
 */
async function getOrCreateClient(serverId) {
  // 检查池中是否已有此服务器的客户端且连接正常
  if (clientPool.has(serverId) && clientPool.get(serverId).isConnected) {
    logger.info(`使用现有MCP客户端连接: ${serverId}`);
    return clientPool.get(serverId).client;
  }

  try {
    // 获取服务器信息
    const server = await _db.getMCPServerById(serverId);
    if (!server) {
      throw new Error(`找不到ID为${serverId}的MCP服务器`);
    }

    logger.info(`为服务器 ${server.name} 创建新MCP客户端连接`);

    // 创建客户端
    const client = await createMCPClient(server);

    // 存储到池中
    clientPool.set(serverId, {
      client,
      isConnected: true,
      server: server,
      lastUsed: Date.now(),
    });

    return client;
  } catch (error) {
    logger.error(`获取或创建MCP客户端失败: ${error.message}`, error);
    throw error;
  }
}

/**
 * 创建MCP客户端
 * @param {Object} serverData 服务器数据
 * @param {number} retryCount 重试次数
 * @param {number} retryDelay 重试延迟(毫秒)
 * @returns {Promise<Client>} MCP客户端实例
 */
const createMCPClient = async (
  serverData,
  retryCount = 3,
  retryDelay = 1000
) => {
  let lastError = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      logger.info(`尝试创建MCP客户端 (${attempt}/${retryCount})...`);

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

      // 添加错误处理，以防连接关闭或错误
      client.on =
        client.on ||
        function (event, handler) {
          if (event === "close") {
            this._onCloseHandlers = this._onCloseHandlers || [];
            this._onCloseHandlers.push(handler);
          } else if (event === "error") {
            this._onErrorHandlers = this._onErrorHandlers || [];
            this._onErrorHandlers.push(handler);
          }
        };

      // 根据服务器类型创建不同的传输
      let transport;
      const connectionTimeout = 15000; // 15秒连接超时

      if (serverData.type === "stdio") {
        // 解析命令行和参数
        const urlParts = serverData.url.split(" ");
        const command = urlParts[0];
        const args = urlParts.slice(1);

        logger.info(
          `创建stdio传输: 命令=${command}, 参数=${JSON.stringify(args)}`
        );
        const mergedEnv = {
          ...serverData.env,
          PATH: getEnhancedPath(process.env.PATH || ""),
        };
        logger.info(`mergedEnv: ${JSON.stringify(mergedEnv)}`);

        // 创建stdio传输
        transport = new StdioClientTransport({
          command,
          args,
          stderr: process.platform === "win32" ? "pipe" : "inherit",
          env: mergedEnv,
          timeout: connectionTimeout,
        });
      } else if (serverData.type === "sse") {
        logger.info(`创建SSE传输: URL=${serverData.url}`);

        // 动态导入SSEClientTransport
        const { SSEClientTransport } = await import(
          "@modelcontextprotocol/sdk/client/sse.js"
        );

        // 创建SSE传输 - 不再使用apiKey
        transport = new SSEClientTransport(new URL(serverData.url));
      } else {
        throw new Error(`不支持的MCP服务器类型: ${serverData.type}`);
      }

      // 连接客户端
      await client.connect(transport);

      // 为client添加处理连接关闭的功能
      const originalDisconnect = client.disconnect;
      client.disconnect = async function () {
        try {
          logger.info(`正在断开MCP客户端连接: ${serverData.name || "unknown"}`);

          if (this._onCloseHandlers) {
            for (const handler of this._onCloseHandlers) {
              try {
                handler();
              } catch (e) {
                logger.warn(`调用连接关闭处理函数失败: ${e.message}`);
              }
            }
          }

          // 检查originalDisconnect是否存在再调用
          if (typeof originalDisconnect === "function") {
            await originalDisconnect.call(this);
          } else {
            // 如果原始断开方法不存在，通过transport直接断开
            if (
              this.transport &&
              typeof this.transport.disconnect === "function"
            ) {
              await this.transport.disconnect();
            }
            // 如果都不存在，标记为已断开状态
            if (this._isConnected !== undefined) {
              this._isConnected = false;
            }
          }

          logger.info(`MCP客户端已成功断开: ${serverData.name || "unknown"}`);
          return true;
        } catch (error) {
          logger.error(`断开MCP客户端连接失败: ${error.message}`);
          return false;
        }
      };

      logger.info(`MCP客户端创建成功: ${serverData.name}`);
      return client;
    } catch (error) {
      lastError = error;
      logger.warn(
        `创建MCP客户端失败(尝试 ${attempt}/${retryCount}): ${error.message}`
      );

      if (attempt < retryCount) {
        // 等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        // 逐渐增加重试延迟
        retryDelay = Math.min(retryDelay * 1.5, 10000); // 最多10秒
      }
    }
  }

  // 所有重试都失败
  logger.error(
    `创建MCP客户端失败，已重试${retryCount}次: ${lastError.message}`
  );
  throw lastError;
};

/**
 * 执行MCP工具
 * @param {string} serverId 服务器ID
 * @param {string} toolId 工具ID
 * @param {Object|string} parameters 工具参数
 * @returns {Promise<Object>} 执行结果
 */
const executeTool = async (serverId, toolId, parameters, retryCount = 1) => {
  let client = null;

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

    try {
      // 获取或创建客户端
      client = await getOrCreateClient(serverId);

      // 确保参数是一个对象
      const parsedParameters =
        typeof parameters === "string"
          ? JSON.parse(parameters)
          : parameters || {};

      logger.info(
        `准备执行工具 ${toolId}，参数:`,
        JSON.stringify(parsedParameters).substring(0, 200) +
          (JSON.stringify(parsedParameters).length > 200 ? "..." : "")
      );

      // 获取工具列表以检查参数格式
      const toolsList = await client.listTools();
      const toolInfo = toolsList.tools.find((tool) => tool.name === toolId);

      if (!toolInfo) {
        throw new Error(`工具 ${toolId} 不存在`);
      }

      // 执行工具
      const result = await client.callTool({
        name: toolId,
        arguments: parsedParameters,
      });

      logger.info(`工具 ${toolId} 执行成功`);

      // 更新最后使用时间
      if (clientPool.has(serverId)) {
        clientPool.get(serverId).lastUsed = Date.now();
      }

      return {
        success: true,
        message: "工具执行成功",
        result: result,
      };
    } catch (error) {
      // 如果是连接错误并且还有重试次数，尝试重新创建连接
      if (error.message.includes("Connection") && retryCount > 0) {
        logger.warn(`MCP连接错误，尝试重新连接: ${error.message}`);

        // 如果客户端连接存在，尝试断开
        if (clientPool.has(serverId)) {
          const poolEntry = clientPool.get(serverId);
          if (
            poolEntry.client &&
            typeof poolEntry.client.disconnect === "function"
          ) {
            try {
              await poolEntry.client.disconnect();
            } catch (e) {
              logger.warn(`断开旧连接失败: ${e.message}`);
            }
          }

          // 标记为断开状态
          poolEntry.isConnected = false;
        }

        // 移除旧连接
        clientPool.delete(serverId);

        // 重新执行工具调用
        return executeTool(serverId, toolId, parameters, retryCount - 1);
      }

      logger.error(`执行工具 ${toolId} 失败: ${error.message}`);
      return {
        success: false,
        message: `执行工具失败: ${error.message}`,
        result: null,
      };
    }
  } catch (error) {
    logger.error(`执行MCP工具失败: ${error.message}`);
    return {
      success: false,
      message: `执行工具失败: ${error.message}`,
      result: null,
    };
  }
};

/**
 * 设置客户端池定期清理
 */
function setupClientPoolCleanup() {
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15分钟未使用则关闭

  setInterval(async () => {
    const now = Date.now();
    const poolEntries = Array.from(clientPool.entries());

    logger.debug(`开始清理MCP客户端连接池，当前连接数: ${poolEntries.length}`);

    for (const [serverId, value] of poolEntries) {
      if (now - value.lastUsed > IDLE_TIMEOUT) {
        logger.info(`关闭空闲的MCP客户端连接: ${serverId}`);

        if (value.client && typeof value.client.disconnect === "function") {
          try {
            await value.client.disconnect();
          } catch (e) {
            logger.warn(`关闭MCP客户端连接失败: ${e.message}`);
          }
        }

        clientPool.delete(serverId);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * 清理所有客户端连接
 * @returns {Promise<Object>} 清理结果
 */
const cleanup = async () => {
  logger.info("清理所有MCP客户端连接");

  const disconnectPromises = [];

  for (const [serverId, value] of clientPool.entries()) {
    if (value.client && typeof value.client.disconnect === "function") {
      disconnectPromises.push(
        (async () => {
          try {
            logger.info(`断开MCP客户端连接: ${serverId}`);
            await value.client.disconnect();
            return true;
          } catch (e) {
            logger.warn(`断开MCP客户端连接失败: ${e.message}`);
            return false;
          }
        })()
      );
    }
  }

  // 等待所有断开连接操作完成
  if (disconnectPromises.length > 0) {
    await Promise.allSettled(disconnectPromises);
  }

  // 清空客户端池
  clientPool.clear();

  return { success: true };
};

/**
 * 测试MCP服务器连接
 * @param {Object} serverData 服务器数据
 * @returns {Promise<Object>} 测试结果
 */
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
      logger.info("获取到的MCP工具列表:", tools);

      // 格式化工具列表，确保参数格式正确
      const formattedTools = tools.tools.map((tool) => {
        logger.info(`处理工具 ${tool.name} 的定义`);
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
      logger.error(`列出工具失败: ${error.message}`);
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
          logger.error(`关闭MCP客户端连接失败: ${e.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`测试MCP连接失败: ${error.message}`);
    return {
      success: false,
      message: `连接失败: ${error.message}`,
      tools: [],
    };
  }
};

/**
 * 初始化MCP模块
 * @param {Object} db 数据库实例
 */
const initMCP = (db) => {
  // 防止重复初始化
  if (_db) {
    logger.warn("MCP服务已初始化，忽略重复调用");
    return;
  }

  _db = db;

  // 启动客户端池清理
  setupClientPoolCleanup();

  // 注册进程退出时的清理函数
  process.on("exit", () => {
    try {
      // 在进程退出时不能使用异步函数，直接同步清理
      logger.info("进程退出，同步清理MCP连接");
      Array.from(clientPool.values()).forEach((value) => {
        if (value.client && typeof value.client.disconnect === "function") {
          try {
            // 调用断开连接，但不等待结果
            value.client.disconnect().catch(() => {});
          } catch (e) {
            // 忽略错误
          }
        }
      });
      clientPool.clear();
    } catch (e) {
      logger.error("退出时清理MCP连接失败:", e);
    }
  });

  logger.info("MCP服务初始化完成");
};

module.exports = {
  createMCPClient,
  testMCPConnection,
  executeTool,
  initMCP,
  cleanup,
};
