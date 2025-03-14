/**
 * DeepSeek 适配器
 * 处理与DeepSeek API的交互
 */

import baseOpenAICompatibleAdapter from "./baseAdapter.js";
import i18n from "../../../../i18n";

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

export default deepseekAdapter;
