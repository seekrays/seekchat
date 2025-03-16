/**
 * 工具格式化模块
 * 负责将MCP工具转换为不同AI提供商所需的格式
 */

/**
 * 将MCP工具转换为OpenAI functions格式
 * @param {Array} mcpTools MCP工具列表
 * @returns {Array} OpenAI functions格式的工具列表
 */
export const formatMCPToolsForOpenAI = (mcpTools) => {
  if (!mcpTools || !Array.isArray(mcpTools) || mcpTools.length === 0) {
    return [];
  }

  return mcpTools.map((tool) => {
    // 获取参数定义
    const parameters = tool.parameters || {};

    return {
      type: "function",
      function: {
        name: tool.id,
        description: tool.description || `${tool.name} from ${tool.serverName}`,
        parameters: {
          type: "object",
          properties: parameters.properties || {},
          required: parameters.required || [],
        },
      },
    };
  });
};

/**
 * 将MCP工具转换为Anthropic tools格式
 * @param {Array} mcpTools MCP工具列表
 * @returns {Array} Anthropic tools格式的工具列表
 */
export const formatMCPToolsForAnthropic = (mcpTools) => {
  if (!mcpTools || !Array.isArray(mcpTools) || mcpTools.length === 0) {
    return [];
  }

  return mcpTools.map((tool) => {
    // 获取参数定义
    const parameters = tool.parameters || {};

    return {
      name: tool.id,
      description: tool.description || `${tool.name} from ${tool.serverName}`,
      input_schema: {
        type: "object",
        properties: parameters.properties || {},
        required: parameters.required || [],
      },
    };
  });
};

/**
 * 根据提供商格式化MCP工具
 * @param {Array} mcpTools MCP工具列表
 * @param {string} providerId 提供商ID
 * @returns {Array} 格式化后的工具列表
 */
export const formatToolsForProvider = (mcpTools, providerId) => {
  if (!mcpTools || !Array.isArray(mcpTools) || mcpTools.length === 0) {
    return [];
  }

  switch (providerId) {
    case "openai":
      return formatMCPToolsForOpenAI(mcpTools);
    case "anthropic":
      return formatMCPToolsForAnthropic(mcpTools);
    default:
      // 默认使用OpenAI格式
      return formatMCPToolsForOpenAI(mcpTools);
  }
};
