/**
 * 通用工具函数
 */

import i18n from "../../../i18n";

/**
 * 安全解析JSON字符串
 * @param {string} jsonStr 要解析的JSON字符串
 * @param {*} defaultValue 解析失败时返回的默认值
 * @returns {*} 解析结果或默认值
 */
export const safeJsonParse = (jsonStr, defaultValue = {}) => {
  if (!jsonStr || typeof jsonStr !== "string") {
    return defaultValue;
  }

  try {
    // 清理可能的特殊token
    let cleanStr = jsonStr;
    if (cleanStr.includes("<｜tool") || cleanStr.includes("<|tool")) {
      const tokenMatch = cleanStr.match(/<[｜|]tool[^>]*>/);
      if (tokenMatch) {
        cleanStr = cleanStr.substring(tokenMatch[0].length);
      }
    }

    // 处理形如 {\"key\": \"value\"}"} 的字符串
    // 1. 检查是否有转义的引号
    if (cleanStr.includes('\\"') || cleanStr.includes('\\"')) {
      // 2. 检查末尾是否有多余的引号和花括号
      const extraEndMatch = cleanStr.match(/"\}+$/);
      if (
        extraEndMatch &&
        cleanStr.lastIndexOf('\\"') < cleanStr.length - extraEndMatch[0].length
      ) {
        // 移除末尾多余的字符
        cleanStr = cleanStr.substring(
          0,
          cleanStr.length - extraEndMatch[0].length + 1
        );
      }

      // 3. 尝试处理双重转义的情况
      if (cleanStr.startsWith('{\\"') || cleanStr.startsWith('{\\"')) {
        try {
          // 先去掉转义，重新解析
          const unescaped = cleanStr.replace(/\\"/g, '"');
          return JSON.parse(unescaped);
        } catch (e) {
          // 如果解析失败，继续使用原来的字符串进行解析
          console.warn("去转义解析失败，尝试原始解析");
        }
      }
    }

    // 处理MCP工具返回的特殊格式JSON，例如：
    // {\"destination\": \"/path/to/dir\", \"source\": \"/path/to/file\"}"}
    if (cleanStr.match(/\\\"/g) && cleanStr.endsWith('"}')) {
      try {
        // 删除末尾的多余引号和花括号
        let fixedStr = cleanStr;
        if (fixedStr.endsWith('"}')) {
          fixedStr = fixedStr.substring(0, fixedStr.length - 1);
        }

        // 处理内部的转义引号
        fixedStr = fixedStr.replace(/\\"/g, '"');

        // 尝试解析处理后的字符串
        const result = JSON.parse(fixedStr);
        console.log("成功处理特殊格式JSON:", result);
        return result;
      } catch (e) {
        console.warn("特殊格式JSON处理失败:", e);
        // 如果失败，继续尝试其他方法
      }
    }

    return JSON.parse(cleanStr);
  } catch (e) {
    console.warn("JSON解析失败:", e, "原始字符串:", jsonStr);

    // 最后尝试：如果字符串以 {"} 结尾，可能是多了一个引号
    if (jsonStr.endsWith('"}')) {
      try {
        // 尝试去掉最后一个引号
        const fixedStr = jsonStr.substring(0, jsonStr.length - 1);
        return JSON.parse(fixedStr);
      } catch {
        // 仍然失败，返回默认值
      }
    }

    return defaultValue;
  }
};

/**
 * 专门处理MCP工具返回的参数
 * 用于处理形如 {\"key\": \"value\"}"} 的字符串
 * @param {string} paramStr 参数字符串
 * @returns {Object} 解析后的对象
 */
export const parseMCPToolParams = (paramStr) => {
  console.log("parseMCPToolParams", paramStr);
  if (!paramStr || typeof paramStr !== "string") {
    return {};
  }

  // 处理代码块格式
  const codeBlockRegex = /```(?:\w*\n)?([\s\S]*?)```/;
  const codeMatch = paramStr.match(codeBlockRegex);
  if (codeMatch) {
    // 提取代码块内容
    let extractedArgs = codeMatch[1].trim();
    // 清理函数调用格式，如 tool_call(name1=value1,name2=value2)
    const functionCallRegex = /^\s*\w+\s*\(([\s\S]*?)\)\s*$/;
    const functionMatch = extractedArgs.match(functionCallRegex);
    if (functionMatch) {
      extractedArgs = functionMatch[1];
    }
    paramStr = extractedArgs;
  }

  // 处理开头可能的多余引号和空格
  paramStr = paramStr.trim().replace(/^["'\s]+/, "");

  // 处理多层转义的JSON字符串
  // 例如: " " \" {\\\"script\\\": \\\"setTimeout...\\\"}\"}""
  if (paramStr.includes('\\\\"')) {
    try {
      // 逐步解除转义，一层一层处理
      let cleaned = paramStr;

      // 去除末尾多余的引号和花括号
      cleaned = cleaned.replace(/["'}]+$/, "");

      // 修复可能的不完整JSON（缺少开始的花括号）
      if (!cleaned.startsWith("{") && cleaned.includes("{")) {
        cleaned = cleaned.substring(cleaned.indexOf("{"));
      }

      // 处理双重转义 \\\" -> \"
      cleaned = cleaned.replace(/\\\\"/g, '\\"');

      // 处理单重转义 \" -> "
      cleaned = cleaned.replace(/\\"/g, '"');

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        console.warn("多层转义JSON解析失败，尝试其他方法", e);
      }
    } catch (e) {
      console.warn("多层转义处理失败:", e);
    }
  }

  // 处理单层转义的JSON字符串
  if (paramStr.includes('\\"')) {
    try {
      // 对于 {\"destination\": \"/path/to/dir\", \"source\": \"/path/to/file\"}"} 这种格式
      if (paramStr.endsWith('"}') || paramStr.endsWith('"}"}')) {
        // 删除末尾多余的 "} 或 "}"
        let cleaned = paramStr;
        while (cleaned.endsWith('"}')) {
          cleaned = cleaned.substring(0, cleaned.length - 1);
        }

        // 替换所有的 \" 为 "
        cleaned = cleaned.replace(/\\"/g, '"');

        try {
          return JSON.parse(cleaned);
        } catch (e) {
          console.warn("单层转义JSON解析失败:", e);
        }
      }
    } catch (e) {
      console.warn("单层转义处理失败:", e);
    }
  }

  // 如果特殊处理失败，回退到通用方法
  return safeJsonParse(paramStr, {});
};

/**
 * 获取提供商适配器
 * @param {string} providerId 提供商 ID
 * @returns {Function} 适配器函数
 */
export const getProviderAdapter = (providerId) => {
  switch (providerId) {
    case "openai":
      return import("../adapters/openAIAdapter.js").then((m) => m.default);
    case "deepseek":
      return import("../adapters/deepseekAdapter.js").then((m) => m.default);
    case "anthropic":
      return import("../adapters/anthropicAdapter.js").then((m) => m.default);
    case "gemini":
      return import("../adapters/geminiAdapter.js").then((m) => m.default);
    default:
      // 对于其他提供商，使用通用 OpenAI 兼容适配器
      return import("../adapters/baseAdapter.js").then((m) => m.default);
  }
};
