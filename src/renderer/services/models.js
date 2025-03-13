/**
 * AI 模型配置文件
 * 包含各种AI服务提供商的模型信息
 */

// 添加i18next导入
import { v4 as uuidv4 } from "uuid";
import i18n from "../i18n";

// 模型分类正则表达式
const VISION_REGEX =
  /\b(llava|moondream|minicpm|gemini-1\.5|gemini-2\.0|gemini-exp|claude-3|vision|glm-4v|qwen-vl|qwen2-vl|qwen2.5-vl|internvl2|grok-vision-beta|pixtral|gpt-4(?:-[\w-]+)|gpt-4o(?:-[\w-]+)?|chatgpt-4o(?:-[\w-]+)?|o1(?:-[\w-]+)?|deepseek-vl(?:[\w-]+)?|kimi-latest)\b/i;

const TEXT_TO_IMAGE_REGEX =
  /flux|diffusion|stabilityai|sd-|dall|cogview|janus/i;
const REASONING_REGEX =
  /^(o\d+(?:-[\w-]+)?|.*\b(?:reasoner|thinking)\b.*|.*-[rR]\d+.*)$/i;
const EMBEDDING_REGEX =
  /(?:^text-|embed|bge-|e5-|LLM2Vec|retrieval|uae-|gte-|jina-clip|jina-embeddings)/i;

// 系统模型定义
export const SYSTEM_MODELS = {
  silicon: [
    {
      id: "deepseek-ai/DeepSeek-R1",
      name: "deepseek-ai/DeepSeek-R1",
      provider: "silicon",
      group: "deepseek-ai",
    },
    {
      id: "deepseek-ai/DeepSeek-V3",
      name: "deepseek-ai/DeepSeek-V3",
      provider: "silicon",
      group: "deepseek-ai",
    },
    {
      id: "Qwen/Qwen2.5-7B-Instruct",
      provider: "silicon",
      name: "Qwen2.5-7B-Instruct",
      group: "Qwen",
    },
    {
      id: "meta-llama/Llama-3.3-70B-Instruct",
      name: "meta-llama/Llama-3.3-70B-Instruct",
      provider: "silicon",
      group: "meta-llama",
    },
    {
      id: "BAAI/bge-m3",
      name: "BAAI/bge-m3",
      provider: "silicon",
      group: "BAAI",
    },
  ],
  openai: [
    {
      id: "gpt-4.5-preview",
      provider: "openai",
      name: " gpt-4.5-preview",
      group: "gpt-4.5",
    },
    { id: "gpt-4o", provider: "openai", name: " GPT-4o", group: "GPT 4o" },
    {
      id: "gpt-4o-mini",
      provider: "openai",
      name: " GPT-4o-mini",
      group: "GPT 4o",
    },
    { id: "o1-mini", provider: "openai", name: " o1-mini", group: "o1" },
    { id: "o1-preview", provider: "openai", name: " o1-preview", group: "o1" },
  ],
  "azure-openai": [
    {
      id: "gpt-4o",
      provider: "azure-openai",
      name: " GPT-4o",
      group: "GPT 4o",
    },
    {
      id: "gpt-4o-mini",
      provider: "azure-openai",
      name: " GPT-4o-mini",
      group: "GPT 4o",
    },
  ],
  deepseek: [
    {
      id: "deepseek-chat",
      provider: "deepseek",
      name: "DeepSeek Chat",
      group: "DeepSeek Chat",
    },
    {
      id: "deepseek-reasoner",
      provider: "deepseek",
      name: "DeepSeek Reasoner",
      group: "DeepSeek Reasoner",
    },
  ],
};

// 服务提供商定义
export const providers = [
  {
    id: "deepseek",
    name: "DeepSeek",
    logo: "assets/providers/deepseek.png",
    baseUrl: "https://api.deepseek.com/v1",
    models: SYSTEM_MODELS.deepseek || [],
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "assets/providers/openai.png",
    baseUrl: "https://api.openai.com/v1",
    models: SYSTEM_MODELS.openai || [],
  },
  {
    id: "silicon",
    name: "siliconflow",
    logo: "assets/providers/silicon.png",
    baseUrl: "https://api.siliconflow.cn/v1",
    models: SYSTEM_MODELS.silicon || [],
  },
];

/**
 * 判断模型是否为推理模型
 * @param {Object} model 模型对象
 * @returns {boolean} 是否为推理模型
 */
export function isReasoningModel(model) {
  if (!model) {
    return false;
  }

  if (model.id.includes("claude-3-7-sonnet") || model.id.includes("o1")) {
    return true;
  }

  return (
    REASONING_REGEX.test(model.id) ||
    (model.type && model.type.includes("reasoning"))
  );
}

/**
 * 获取当前配置对应的模型名称
 */
export function getModelName(providerId, modelId) {
  const provider = providers.find((p) => p.id === providerId);
  if (!provider) return i18n.t("settings.unknownModel");

  const model = provider.models.find((m) => m.id === modelId);
  return model ? model.name : i18n.t("settings.unknownModel");
}

/**
 * 获取指定提供商的所有模型
 * @param {string} providerId 提供商ID
 * @returns {Array} 模型列表
 */
export function getProviderModels(providerId) {
  const provider = providers.find((p) => p.id === providerId);
  return provider ? provider.models : [];
}
