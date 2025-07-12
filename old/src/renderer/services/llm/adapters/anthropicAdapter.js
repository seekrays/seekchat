/**
 * Anthropic 适配器
 * 处理与Anthropic API的交互
 */

import baseOpenAICompatibleAdapter from "./baseAdapter.js";
import i18n from "../../../i18n";

/**
 * Anthropic 提供商适配器
 * @param {Array} messages 消息列表
 * @param {Object} provider 提供商配置
 * @param {Object} model 模型配置
 * @param {Function} onProgress 进度回调函数
 * @param {Function} onComplete 完成回调函数
 * @param {Object} options 选项参数
 * @returns {Promise} 响应
 */
const anthropicAdapter = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {}
) => {
  // Anthropic使用不同的端点和请求格式
  const adapterConfig = {
    endpoint: "/v1/messages",

    // 请求体转换器
    requestTransformer: (requestBody, model, options) => {
      // 转换格式为Anthropic兼容
      const formattedMessages = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      const result = {
        model: model.id,
        messages: formattedMessages,
        temperature: requestBody.temperature,
        max_tokens: options.max_tokens || 2000,
        stream: !!onProgress,
      };

      // 添加工具支持
      if (
        options.tools &&
        Array.isArray(options.tools) &&
        options.tools.length > 0
      ) {
        result.tools = options.tools;
      }

      return result;
    },

    // 响应解析器
    responseParser: (data, model) => {
      const content =
        data.content && data.content.length > 0
          ? data.content.map((item) => item.text).join("")
          : "";

      return {
        content,
        reasoning_content: "",
        model: model.id,
        toolCalls: data.tool_calls || [],
      };
    },

    // 流处理器
    streamProcessor: (data, content, reasoning_content, toolCalls) => {
      let hasUpdate = false;

      if (
        data.type === "content_block_delta" &&
        data.delta &&
        data.delta.text
      ) {
        content += data.delta.text;
        hasUpdate = true;
      } else if (data.type === "message_stop") {
        // 消息结束
      } else if (data.type === "tool_call_delta") {
        // 处理工具调用更新
        const deltaToolCall = data.delta;

        // 找到现有工具调用或创建新的
        let existingToolCall = toolCalls.find(
          (tc) => tc.id === data.tool_call_id
        );

        if (!existingToolCall) {
          existingToolCall = {
            id: data.tool_call_id,
            type: "function",
            function: { name: "", arguments: "" },
          };
          toolCalls.push(existingToolCall);
        }

        // 更新函数信息
        if (deltaToolCall.name) {
          existingToolCall.function.name = deltaToolCall.name;
        }

        // 处理不同形式的输入参数
        if (deltaToolCall.input) {
          // 如果是对象，直接序列化
          if (typeof deltaToolCall.input === "object") {
            try {
              existingToolCall.function.arguments = JSON.stringify(
                deltaToolCall.input
              );
            } catch (e) {
              console.warn("序列化Anthropic工具输入失败:", e);
              existingToolCall.function.arguments = "{}";
            }
          }
          // 如果是字符串，可能已经是JSON或需要附加到现有参数
          else if (typeof deltaToolCall.input === "string") {
            // 清理可能包含的特殊token
            let inputStr = deltaToolCall.input;
            if (inputStr.includes("<｜tool") || inputStr.includes("<|tool")) {
              console.warn("Anthropic工具输入包含特殊token:", inputStr);
              const tokenMatch = inputStr.match(/<[｜|]tool[^>]*>/);
              if (tokenMatch) {
                inputStr = inputStr.substring(tokenMatch[0].length);
              }
            }

            // 追加到现有参数
            existingToolCall.function.arguments += inputStr;
          }
        }

        hasUpdate = true;
      }

      return {
        content,
        reasoning_content,
        toolCalls,
        hasUpdate,
      };
    },
  };

  return baseOpenAICompatibleAdapter(
    messages,
    provider,
    model,
    onProgress,
    onComplete,
    options,
    adapterConfig
  );
};

export default anthropicAdapter;
