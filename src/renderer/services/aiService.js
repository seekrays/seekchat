/**
 * AI 服务管理模块
 * 负责与各种 AI 服务提供商的 API 交互
 */

// 导入模型配置
import { providers, getModelName, getProviderModels } from "./models.js";
import { getProvidersConfig } from "../hooks/useUserConfig";

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
 * 将MCP工具转换为OpenAI functions格式
 * @param {Array} mcpTools MCP工具列表
 * @returns {Array} OpenAI functions格式的工具列表
 */
const formatMCPToolsForOpenAI = (mcpTools) => {
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
const formatMCPToolsForAnthropic = (mcpTools) => {
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
const formatToolsForProvider = (mcpTools, providerId) => {
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

/**
 * 处理工具调用
 * @param {Object} toolCall 工具调用对象
 * @param {Array} mcpTools MCP工具列表
 * @returns {Promise<Object>} 工具调用结果
 */
const handleToolCall = async (toolCall, mcpTools) => {
  try {
    // 从MCP工具列表中找到对应的工具
    const tool = mcpTools.find((t) => t.id === toolCall.function.name);
    if (!tool) {
      throw new Error(`找不到ID为${toolCall.function.name}的工具`);
    }

    // 解析参数
    let args;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch (error) {
      throw new Error(`工具参数解析失败: ${error.message}`);
    }

    // 导入MCP服务
    const mcpService = (await import("./mcpService.js")).default;

    // 调用MCP工具
    console.log(`调用MCP工具: ${tool.id}，参数:`, args);
    const result = await mcpService.callTool(tool.serverId, tool.id, args);

    if (!result.success) {
      throw new Error(`工具调用失败: ${result.message}`);
    }

    return {
      success: true,
      toolName: tool.name,
      result: result.result,
    };
  } catch (error) {
    console.error("工具调用失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 基础OpenAI兼容适配器
 * 为所有OpenAI兼容的提供商提供统一的接口实现
 *
 * @param {Array} messages - 消息列表
 * @param {Object} provider - 提供商配置
 * @param {Object} model - 模型配置
 * @param {Function} onProgress - 流式回调函数
 * @param {Function} onComplete - 完成回调函数
 * @param {Object} options - 选项参数
 * @param {Object} adapterConfig - 适配器特定配置
 * @returns {Promise<Object>} 响应对象
 */
const baseOpenAICompatibleAdapter = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {},
  adapterConfig = {}
) => {
  // 提取适配器配置
  const {
    // 端点配置
    endpoint = "/chat/completions",
    // 请求体转换器
    requestTransformer = null,
    // 响应解析器
    responseParser = null,
    // 流式响应处理器
    streamProcessor = null,
    // 错误处理器
    errorHandler = null,
  } = adapterConfig;

  // 获取API密钥和基础URL
  const apiKey = provider.apiKey;
  const baseUrl = provider.baseUrl || "";

  // 构建请求头
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // 默认请求体
  let requestBody = {
    model: model.id,
    messages: messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    stream: !!onProgress, // 如果有onProgress回调，启用流式传输
  };

  // 处理工具/函数
  if (
    options.tools &&
    Array.isArray(options.tools) &&
    options.tools.length > 0
  ) {
    requestBody.tools = options.tools;
    requestBody.tool_choice = "auto"; // 默认让模型自动选择是否使用工具
  }

  // 如果有请求转换器，使用转换器修改请求体
  if (requestTransformer) {
    requestBody = requestTransformer(requestBody, model, options, provider);
  }

  console.log(`${provider.name} API请求参数:`, {
    model: model.id,
    messagesCount: messages.length,
    temperature: requestBody.temperature,
    hasSignal: !!options.signal,
    hasTools: Boolean(requestBody.tools),
  });

  try {
    // 构建请求URL
    const requestUrl = `${baseUrl}${endpoint}`;

    // 发送API请求
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: options.signal, // 添加信号用于取消请求
    });

    // 处理错误响应
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: { message: `HTTP error ${response.status}` } };
      }

      const errorMessage =
        errorData.error?.message ||
        `${provider.name} API error: ${response.status}`;

      // 如果有自定义错误处理器，调用它
      if (errorHandler) {
        return errorHandler(errorMessage, errorData, response);
      }

      throw new Error(errorMessage);
    }

    // 处理流式响应
    if (requestBody.stream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let content = "";
      let reasoning_content = "";
      let currentToolCalls = [];

      // 读取流式响应
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter(
            (line) => line.trim() !== "" && line.trim() !== "data: [DONE]"
          );

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              // 解析数据行
              const data = JSON.parse(line.slice(6));

              // 使用流处理器或默认处理逻辑
              if (streamProcessor) {
                const result = streamProcessor(
                  data,
                  content,
                  reasoning_content,
                  currentToolCalls
                );
                if (result) {
                  content =
                    result.content !== undefined ? result.content : content;
                  reasoning_content =
                    result.reasoning_content !== undefined
                      ? result.reasoning_content
                      : reasoning_content;
                  currentToolCalls =
                    result.toolCalls !== undefined
                      ? result.toolCalls
                      : currentToolCalls;

                  // 如果有内容更新，调用进度回调
                  if (result.hasUpdate) {
                    onProgress({
                      content,
                      reasoning_content,
                      toolCalls: currentToolCalls,
                    });
                  }
                }
              } else {
                // 默认OpenAI格式处理
                let hasUpdate = false;

                if (data.choices && data.choices[0].delta) {
                  // 处理内容更新
                  if (data.choices[0].delta.content) {
                    content += data.choices[0].delta.content;
                    hasUpdate = true;
                  }

                  // 处理reasoning_content更新
                  if (data.choices[0].delta.reasoning_content) {
                    reasoning_content +=
                      data.choices[0].delta.reasoning_content;
                    hasUpdate = true;
                  }

                  // 处理工具调用更新
                  if (data.choices[0].delta.tool_calls) {
                    // 合并工具调用信息
                    const deltaToolCalls = data.choices[0].delta.tool_calls;

                    for (const deltaToolCall of deltaToolCalls) {
                      const {
                        index,
                        id,
                        type,
                        function: functionData,
                      } = deltaToolCall;

                      // 查找现有工具调用或创建新的
                      let existingToolCall = currentToolCalls.find(
                        (tc) => tc.index === index
                      );

                      if (!existingToolCall) {
                        existingToolCall = {
                          index,
                          id: id || "",
                          type: type || "",
                          function: { name: "", arguments: "" },
                        };
                        currentToolCalls.push(existingToolCall);
                      }

                      // 更新ID和类型
                      if (id) existingToolCall.id = id;
                      if (type) existingToolCall.type = type;

                      // 更新函数信息
                      if (functionData) {
                        if (functionData.name) {
                          existingToolCall.function.name = functionData.name;
                        }
                        if (functionData.arguments) {
                          existingToolCall.function.arguments +=
                            functionData.arguments;
                        }
                      }
                    }

                    hasUpdate = true;
                  }
                }

                // 如果有更新，调用进度回调
                if (hasUpdate) {
                  onProgress({
                    content,
                    reasoning_content,
                    toolCalls: currentToolCalls,
                  });
                }
              }
            } catch (e) {
              console.error("解析流数据失败:", e);
            }
          }
        }
      }

      // 流结束，调用完成回调
      if (onComplete) {
        onComplete({
          content,
          reasoning_content,
          toolCalls: currentToolCalls,
        });
      }

      // 返回最终结果
      return {
        content,
        reasoning_content,
        model: model.id,
        toolCalls: currentToolCalls,
      };
    } else {
      // 处理非流式响应
      const data = await response.json();

      // 使用响应解析器或默认解析逻辑
      let result;
      if (responseParser) {
        result = responseParser(data, model);
      } else {
        // 默认OpenAI格式解析
        const content =
          data.choices && data.choices[0].message
            ? data.choices[0].message.content
            : "";

        const reasoning_content =
          data.choices &&
          data.choices[0].message &&
          data.choices[0].message.reasoning_content
            ? data.choices[0].message.reasoning_content
            : "";

        // 提取工具调用
        const toolCalls =
          data.choices &&
          data.choices[0].message &&
          data.choices[0].message.tool_calls
            ? data.choices[0].message.tool_calls
            : [];

        result = {
          content,
          reasoning_content,
          model: data.model || model.id,
          usage: data.usage,
          toolCalls,
        };
      }

      // 调用完成回调
      if (onComplete) {
        onComplete({
          content: result.content,
          reasoning_content: result.reasoning_content,
          toolCalls: result.toolCalls,
        });
      }

      return result;
    }
  } catch (error) {
    // 处理请求被取消的情况
    if (error.name === "AbortError") {
      console.log(`${provider.name}请求被用户取消`);
      throw error;
    }

    // 重新抛出其他错误
    throw new Error(`${provider.name} API 错误: ${error.message}`);
  }
};

/**
 * OpenAI 提供商适配器
 * @param {Array} messages 消息列表
 * @param {Object} provider 提供商配置
 * @param {Object} model 模型配置
 * @param {Function} onProgress 进度回调函数
 * @param {Function} onComplete 完成回调函数
 * @param {Object} options 选项参数
 * @returns {Promise} 响应
 */
const openAIAdapter = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {}
) => {
  return baseOpenAICompatibleAdapter(
    messages,
    provider,
    model,
    onProgress,
    onComplete,
    options
  );
};

/**
 * DeepSeek 提供商适配器
 * @param {Array} messages 消息列表
 * @param {Object} provider 提供商配置
 * @param {Object} model 模型配置
 * @param {Function} onProgress 进度回调函数
 * @param {Function} onComplete 完成回调函数
 * @param {Object} options 选项参数
 * @returns {Promise} 响应
 */
const deepseekAdapter = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {}
) => {
  return baseOpenAICompatibleAdapter(
    messages,
    provider,
    model,
    onProgress,
    onComplete,
    options
  );
};

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
        if (deltaToolCall.input && typeof deltaToolCall.input === "object") {
          // Anthropic可能直接提供结构化的输入
          existingToolCall.function.arguments = JSON.stringify(
            deltaToolCall.input
          );
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

/**
 * 通用 OpenAI 兼容提供商适配器
 * @param {Array} messages 消息列表
 * @param {Object} provider 提供商配置
 * @param {Object} model 模型配置
 * @param {Function} onProgress 进度回调函数
 * @param {Function} onComplete 完成回调函数
 * @param {Object} options 选项参数
 * @returns {Promise} 响应
 */
const openAICompatibleAdapter = async (
  messages,
  provider,
  model,
  onProgress,
  onComplete,
  options = {}
) => {
  return baseOpenAICompatibleAdapter(
    messages,
    provider,
    model,
    onProgress,
    onComplete,
    options
  );
};

/**
 * 获取提供商适配器
 * @param {string} providerId 提供商 ID
 * @returns {Function} 适配器函数
 */
const getProviderAdapter = (providerId) => {
  switch (providerId) {
    case "openai":
      return openAIAdapter;
    case "deepseek":
      return deepseekAdapter;
    case "anthropic":
      return anthropicAdapter;
    case "gemini":
      return geminiAdapter;
    default:
      // 对于其他提供商，使用通用 OpenAI 兼容适配器
      return openAICompatibleAdapter;
  }
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
    throw new Error("请先选择服务提供商和模型");
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
    throw new Error("请先设置 API 密钥");
  }

  // 检查提供商是否被禁用
  const providersConfig = getProvidersConfig();
  const savedProvider = providersConfig[provider.id];
  if (savedProvider && savedProvider.enabled === false) {
    console.error("提供商已禁用:", provider.name);
    throw new Error(`服务提供商 ${provider.name} 已被禁用，请先在设置中启用`);
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
    const adapter = getProviderAdapter(provider.id);
    if (!adapter) {
      console.error("找不到适配器:", provider.id);
      throw new Error(`不支持的提供商: ${provider.name}`);
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

        // 添加AI的响应消息（包含工具调用）
        updatedMessages.push({
          role: "assistant",
          content: completeData.content || "",
          tool_calls: completeData.toolCalls,
        });

        // 处理每个工具调用
        for (const toolCall of completeData.toolCalls) {
          if (toolCall.type === "function" && toolCall.function) {
            // 调用工具
            const toolResult = await handleToolCall(toolCall, options.mcpTools);

            // 添加工具响应到消息队列
            updatedMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(
                toolResult.success
                  ? toolResult.result
                  : { error: toolResult.error }
              ),
            });
          }
        }

        // 使用更新后的消息队列再次调用AI（不传递工具）
        const followupOptions = { ...options };
        delete followupOptions.mcpTools;

        // 调用AI获取最终响应
        return sendMessageToAI(
          updatedMessages,
          provider,
          model,
          onProgress,
          onComplete,
          followupOptions
        );
      }

      // 如果没有工具调用，直接调用原始完成回调
      if (onComplete) {
        onComplete(completeData);
      }

      return completeData;
    };

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

export {
  sendMessageToAI,
  getModelName,
  getProviderModels,
  formatToolsForProvider,
  handleToolCall,
};
