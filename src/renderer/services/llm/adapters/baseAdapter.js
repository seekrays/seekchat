/**
 * 基础OpenAI兼容适配器
 * 为所有OpenAI兼容的提供商提供统一的接口实现
 */

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
export const baseOpenAICompatibleAdapter = async (
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
    tools: requestBody.tools,
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
                    console.log("onProgress", {
                      content,
                      reasoning_content,
                      toolCalls: currentToolCalls,
                    });
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
                          // 处理可能包含特殊token的参数
                          let argsStr = functionData.arguments;
                          if (
                            argsStr.includes("<｜tool") ||
                            argsStr.includes("<|tool")
                          ) {
                            console.warn(
                              "OpenAI工具参数包含特殊token:",
                              argsStr
                            );
                            const tokenMatch =
                              argsStr.match(/<[｜|]tool[^>]*>/);
                            if (tokenMatch) {
                              argsStr = argsStr.substring(tokenMatch[0].length);
                            }
                          }
                          existingToolCall.function.arguments += argsStr;
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
        console.log("onComplete", {
          content,
          reasoning_content,
          toolCalls: currentToolCalls,
        });
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
        onComplete(result);
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

export default baseOpenAICompatibleAdapter;
