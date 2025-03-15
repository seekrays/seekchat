/**
 * 工具调用处理模块
 * 负责处理AI工具的调用和响应处理
 */

import { safeJsonParse, parseMCPToolParams } from "../utils/common.js";
import i18n from "../../../i18n/index.js";

/**
 * 处理工具调用
 * @param {Object} toolCall 工具调用对象
 * @param {Array} mcpTools MCP工具列表
 * @param {Function} onProgress 进度回调函数
 * @returns {Promise<Object>} 工具调用结果
 */
export const handleToolCall = async (toolCall, mcpTools, onProgress) => {
  try {
    // 从MCP工具列表中找到对应的工具
    const tool = mcpTools.find((t) => t.id === toolCall.function.name);
    if (!tool) {
      throw new Error(
        i18n.t("error.toolNotFound", { id: toolCall.function.name })
      );
    }

    // 解析参数
    let args;
    try {
      console.log("toolCall", toolCall);
      // 检查并清理工具调用参数字符串
      let argsStr = toolCall.function.arguments || "{}";

      // 使用增强的MCP工具参数解析函数
      args = parseMCPToolParams(argsStr);
      console.log("工具参数解析成功:", args);
    } catch (e) {
      console.error("解析工具参数失败:", e);
      return {
        success: false,
        message: i18n.t("error.toolParameterParseFailed"),
      };
    }

    // 通知正在调用工具
    if (onProgress) {
      onProgress({
        toolCallStatus: {
          id: toolCall.id,
          name: tool.name,
          status: "running",
          message: i18n.t("status.callingTool", { name: tool.name }),
        },
      });
    }

    // 导入MCP服务
    const mcpService = (await import("../../mcpService.js")).default;

    // 调用MCP工具
    console.log(`调用MCP工具: ${tool.id}，参数:`, args);
    const result = await mcpService.callTool(tool.serverId, tool.id, args);

    if (!result.success) {
      throw new Error(
        i18n.t("error.toolExecutionFailed", { message: result.message })
      );
    }

    // 通知工具调用成功
    if (onProgress) {
      onProgress({
        toolCallStatus: {
          id: toolCall.id,
          name: tool.name,
          status: "success",
          message: i18n.t("status.toolCallSuccess", { name: tool.name }),
        },
      });
    }

    return {
      success: true,
      toolName: tool.name,
      result: result.result,
    };
  } catch (error) {
    console.error("工具调用失败:", error);

    // 通知工具调用失败
    if (onProgress) {
      onProgress({
        toolCallStatus: {
          id: toolCall?.id,
          name:
            mcpTools.find((t) => t.id === toolCall?.function?.name)?.name ||
            toolCall?.function?.name ||
            i18n.t("common.unknownTool"),
          status: "error",
          message: i18n.t("error.toolExecutionFailed", {
            message: error.message,
          }),
        },
      });
    }

    return {
      success: false,
      error: error.message,
    };
  }
};
