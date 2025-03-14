/**
 * 通用工具函数
 */

/**
 * 安全地解析JSON字符串，如果解析失败则返回默认值
 * @param {string} jsonStr JSON字符串
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

    return JSON.parse(cleanStr);
  } catch (e) {
    console.warn("JSON解析失败:", e, "原始字符串:", jsonStr);
    return defaultValue;
  }
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
