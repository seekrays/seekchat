/**
 * AI 服务管理模块
 * 负责与各种 AI 服务提供商的 API 交互
 */

// 导入模型配置
import { providers } from "./models.js";
import { getProvidersConfig } from "../hooks/useUserConfig";
import i18n from "../i18n";

// 导入工具相关功能
import { formatToolsForProvider } from "./llm/tools/toolFormatter.js";
import { handleToolCall } from "./llm/tools/toolHandler.js";

// 导入工具函数
import { safeJsonParse, getProviderAdapter } from "./llm/utils/common.js";

/**
 * 获取启用的提供商列表
 * @returns {Array} 启用的提供商列表
 */
export const getEnabledProviders = () => {
  const providersConfig = getProvidersConfig();
  return providers.filter((provider) => {
    // 获取保存的供应商配置
    const savedProvider = providersConfig[provider.id];

    // 如果配置中明确设置为false，则禁用
    if (savedProvider && savedProvider.enabled === false) {
      return false;
    }

    // 将models中enabled的值也附加上去
    if (provider.models) {
      provider.models = provider.models.map((model) => {
        // 检查savedProvider是否存在且有models属性
        if (
          savedProvider &&
          savedProvider.models &&
          Array.isArray(savedProvider.models)
        ) {
          // 在savedProvider中找到对应的模型，如果存在，则将enabled的值附加上去
          const savedModel = savedProvider.models.find(
            (m) => m.id === model.id
          );
          return { ...model, enabled: savedModel?.enabled ?? true };
        }
        // 如果savedProvider不存在或没有models属性，默认启用所有模型
        return { ...model, enabled: true };
      });
    } else {
      // 如果provider没有models属性，初始化为空数组
      provider.models = [];
      console.warn(
        `Provider ${provider.name} (${provider.id}) 没有models属性，已初始化为空数组`
      );
    }

    // 默认启用
    return true;
  });
};

/**
 * 发送消息到 AI API
 * @param {Array} messages 消息数组
 * @param {Object} provider 提供商配置
 * @param {Object} model 模型配置
 * @param {Function} onProgress 进度回调函数，用于流式传输
 * @param {Function} onComplete 完成回调函数
 * @param {Object} options 选项，包含temperature等参数和signal用于取消请求
 * @returns {Promise} 响应
 */
const sendMessageToAI = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {}
) => {
  if (!provider || !model) {
    console.error("缺少提供商或模型:", { provider, model });
    throw new Error(i18n.t("chat.missingProviderOrModel"));
  }

  // 处理选项，设置默认值
  const temperature =
    options.temperature !== undefined ? options.temperature : 0.7;

  // 处理MCP工具选项
  const tools = options.mcpTools
    ? formatToolsForProvider(options.mcpTools, provider.id)
    : [];

  // 检查是否需要使用模拟响应
  const useMockResponse =
    process.env.NODE_ENV === "development" ||
    provider.mockResponse ||
    !provider.apiKey;

  // 如果不是模拟响应，则需要 API 密钥
  if (!useMockResponse && !provider.apiKey) {
    console.error("缺少 API 密钥:", provider.name);
    throw new Error(i18n.t("settings.apiKeyRequired"));
  }

  // 检查提供商是否被禁用
  const providersConfig = getProvidersConfig();
  const savedProvider = providersConfig[provider.id];
  if (savedProvider && savedProvider.enabled === false) {
    console.error("提供商已禁用:", provider.name);
    throw new Error(
      i18n.t("settings.providerDisabled", { name: provider.name })
    );
  }

  try {
    console.log(`准备调用 ${provider.name} 的 API`, {
      modelId: model.id,
      messagesCount: messages.length,
      useStream: !!onProgress,
      useMockResponse,
      temperature,
      hasSignal: !!options.signal,
      hasTools: tools.length > 0,
    });

    // 获取适配器
    const adapterPromise = getProviderAdapter(provider.id);
    if (!adapterPromise) {
      console.error("找不到适配器:", provider.id);
      throw new Error(
        i18n.t("settings.unsupportedProvider", { name: provider.name })
      );
    }

    // 自定义处理工具调用的进度回调
    const progressHandler = (progressData) => {
      // 调用原始进度回调
      if (onProgress) {
        onProgress(progressData);
      }
    };

    // 自定义处理工具调用的完成回调
    const completeHandler = async (completeData) => {
      // 检查是否有工具调用
      if (completeData.toolCalls && completeData.toolCalls.length > 0) {
        // 创建一个新的消息队列
        const updatedMessages = [...messages];

        // 获取或初始化累积的工具调用结果
        const prevToolCallResults = completeData.toolCallResults || [];
        let toolCallResults = [...prevToolCallResults];

        // 添加AI的响应消息（包含工具调用）
        updatedMessages.push({
          role: "assistant",
          content: completeData.content || "",
          tool_calls: completeData.toolCalls,
        });

        // 通知前端开始处理工具调用
        if (onProgress) {
          onProgress({
            content: completeData.content || "",
            reasoning_content: completeData.reasoning_content || "",
            toolCalls: completeData.toolCalls,
            toolCallsProcessing: true,
            message: i18n.t("chat.callingTool"),
          });
        }

        // 处理每个工具调用
        for (const toolCall of completeData.toolCalls) {
          if (toolCall.type === "function" && toolCall.function) {
            try {
              // 调用工具
              const toolResult = await handleToolCall(
                toolCall,
                options.mcpTools,
                onProgress
              );

              // 记录工具调用结果
              toolCallResults.push({
                id: toolCall.id,
                tool_id: toolCall.function.name,
                tool_name:
                  options.mcpTools?.find((t) => t.id === toolCall.function.name)
                    ?.name || toolCall.function.name,
                parameters:
                  typeof toolCall.function.arguments === "string"
                    ? safeJsonParse(toolCall.function.arguments, {})
                    : toolCall.function.arguments,
                result: toolResult,
                status: toolResult.success ? "success" : "error",
              });

              // 添加工具响应消息
              updatedMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content:
                  typeof toolResult === "string"
                    ? toolResult
                    : JSON.stringify(toolResult, null, 2),
              });
            } catch (error) {
              console.error(`工具调用失败:`, error);

              // 记录失败的工具调用
              toolCallResults.push({
                id: toolCall.id,
                tool_id: toolCall.function.name,
                tool_name:
                  options.mcpTools?.find((t) => t.id === toolCall.function.name)
                    ?.name || toolCall.function.name,
                parameters:
                  typeof toolCall.function.arguments === "string"
                    ? safeJsonParse(toolCall.function.arguments, {})
                    : toolCall.function.arguments,
                result: error.message,
                status: "error",
              });

              // 添加工具错误响应消息
              updatedMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: `Error: ${error.message}`,
              });
            }
          }
        }

        // 获取当前递归深度或初始化为1
        const recursionDepth = options._recursionDepth || 1;

        // 检查是否超过最大递归深度(5轮)，防止无限循环
        const maxRecursionDepth = 5;
        const hasReachedMaxDepth = recursionDepth >= maxRecursionDepth;

        // 在完成数据中添加工具调用结果
        completeData.toolCallResults = toolCallResults;

        // 通知前端工具调用完成，准备继续对话
        if (onProgress) {
          onProgress({
            content: completeData.content || "",
            reasoning_content: completeData.reasoning_content || "",
            toolCalls: completeData.toolCalls,
            toolCallResults: toolCallResults,
            toolCallsProcessing: false,
            message: hasReachedMaxDepth
              ? i18n.t("chat.mcpTools.maxToolCallsReached")
              : i18n.t("chat.mcpTools.toolCallCompleted"),
          });
        }

        // 如果达到最大调用深度，不再继续递归调用
        if (hasReachedMaxDepth) {
          console.log(`已达到最大工具调用次数(${maxRecursionDepth})，停止递归`);

          // 调用原始完成回调
          if (onComplete) {
            // 构建最终结果
            const finalResult = {
              ...completeData,
              content:
                completeData.content +
                "\n\n[" +
                i18n.t("chat.mcpTools.maxToolCallsReached") +
                "]",
              toolCallResults: toolCallResults,
            };
            onComplete(finalResult);
          }

          return {
            ...completeData,
            content:
              completeData.content +
              "\n\n[" +
              i18n.t("chat.mcpTools.maxToolCallsReached") +
              "]",
            toolCallResults: toolCallResults,
          };
        }

        // 创建一个新的递归跟踪标志，用于防止内部onComplete被调用
        const followupOptions = {
          ...options,
          // 增加递归深度计数
          _recursionDepth: recursionDepth + 1,
          // 添加一个递归标记，用于内部逻辑判断
          _isFollowupCall: true,
        };

        // 不要删除mcpTools，保留工具列表以便AI可以继续使用其他工具

        // 创建一个包装的完成回调，处理最终结果
        const wrappedComplete = (finalData) => {
          // 合并前面所有工具调用结果到最终数据
          finalData.toolCallResults = toolCallResults.concat(
            finalData.toolCallResults || []
          );

          // 调用原始的onComplete，不论是否有更多工具调用
          if (onComplete) {
            console.log("调用最终的onComplete回调", finalData);
            onComplete(finalData);
          }

          return finalData;
        };

        // 使用更新后的消息队列再次调用AI
        console.log(`开始第${recursionDepth + 1}轮工具调用递归`);
        return sendMessageToAI(
          updatedMessages,
          provider,
          model,
          onProgress,
          wrappedComplete,
          followupOptions
        );
      }

      // 如果没有工具调用，直接调用原始完成回调
      // 确保最终的响应一定会触发onComplete
      if (onComplete) {
        console.log("没有工具调用，直接调用onComplete回调", completeData);
        onComplete(completeData);
      }

      return completeData;
    };

    // 获取适配器实现
    const adapter = await adapterPromise;

    // 调用适配器，传递温度参数和取消信号
    return await adapter(
      messages,
      provider,
      model,
      progressHandler,
      completeHandler,
      {
        temperature,
        signal: options.signal,
        tools,
        ...options,
      }
    );
  } catch (error) {
    // 如果是AbortError，直接传递
    if (error.name === "AbortError") {
      console.log(`${provider.name} 请求被用户取消`);
      throw error;
    }

    console.error("调用 AI API 失败:", error);
    throw error;
  }
};

export { sendMessageToAI, formatToolsForProvider, handleToolCall };
