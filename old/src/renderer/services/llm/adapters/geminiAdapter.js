/**
 * Gemini 适配器
 * 处理与Google Gemini API的交互
 */

import baseOpenAICompatibleAdapter from "./baseAdapter.js";

/**
 * Gemini 提供商适配器
 * @param {Array} messages 消息列表
 * @param {Object} provider 提供商配置
 * @param {Object} model 模型配置
 * @param {Function} onProgress 进度回调函数
 * @param {Function} onComplete 完成回调函数
 * @param {Object} options 选项参数
 * @returns {Promise} 响应
 */
const geminiAdapter = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {}
) => {
  // Gemini使用不同的端点和请求格式
  const adapterConfig = {
    endpoint: `/models/${model.id}:generateContent?key=${provider.apiKey}`,

    // 请求体转换器
    requestTransformer: (requestBody, model, options) => {
      const formattedMessages = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      return {
        contents: formattedMessages,
        generationConfig: {
          temperature: requestBody.temperature,
          maxOutputTokens: options.max_tokens || 2000,
        },
        stream: !!onProgress,
      };
    },

    // 流处理器
    streamProcessor: (data, content, reasoning_content) => {
      let hasUpdate = false;

      if (
        data.candidates &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
      ) {
        const newText = data.candidates[0].content.parts[0].text || "";
        if (newText) {
          content += newText;
          hasUpdate = true;
        }
      }

      return {
        content,
        reasoning_content,
        hasUpdate,
      };
    },

    // 响应解析器
    responseParser: (data, model) => {
      const content =
        data.candidates &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
          ? data.candidates[0].content.parts[0].text || ""
          : "";

      return {
        content,
        reasoning_content: "",
        model: model.id,
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

export default geminiAdapter;
