/**
 * AI 模型配置文件
 * 包含各种AI服务提供商的模型信息
 */

// 添加i18next导入
import { v4 as uuidv4 } from "uuid";
import i18n from "../i18n";
import { getProvidersConfig } from "../hooks/useUserConfig";

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
  moonshot: [
    {
      id: "moonshot-v1-auto",
      name: "moonshot-v1-auto",
      provider: "moonshot",
      group: "moonshot-v1",
    },
  ],
  bailian: [
    {
      id: "qwen-vl-plus",
      name: "qwen-vl-plus",
      provider: "dashscope",
      group: "qwen-vl",
    },
    {
      id: "qwen-coder-plus",
      name: "qwen-coder-plus",
      provider: "dashscope",
      group: "qwen-coder",
    },
    {
      id: "qwen-turbo",
      name: "qwen-turbo",
      provider: "dashscope",
      group: "qwen-turbo",
    },
    {
      id: "qwen-plus",
      name: "qwen-plus",
      provider: "dashscope",
      group: "qwen-plus",
    },
    {
      id: "qwen-max",
      name: "qwen-max",
      provider: "dashscope",
      group: "qwen-max",
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
  {
    id: "lmstudio",
    name: "lmstudio",
    logo: "assets/providers/lmstudio.png",
    baseUrl: "http://127.0.0.1:1234/v1",
    models: [],
  },
  {
    id: "ollama",
    name: "ollama",
    logo: "assets/providers/ollama.png",
    baseUrl: "http://127.0.0.1:11434/v1",
    models: [],
  },
  {
    id: "moonshot",
    name: "moonshot",
    logo: "assets/providers/moonshot.png",
    baseUrl: "https://api.moonshot.cn/v1",
    models: SYSTEM_MODELS.moonshot || [],
  },
  {
    id: "dashscope",
    name: "阿里云百炼",
    logo: "assets/providers/dashscope.png",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: SYSTEM_MODELS.dashscope || [],
  },
  {
    id: "doubao",
    name: "Doubao",
    logo: "assets/providers/doubao.png",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    models: SYSTEM_MODELS.doubao || [],
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
 * @param {string} providerId 提供商ID
 * @param {string} modelId 模型ID
 * @param {boolean} useAllProviders 是否使用所有提供商（包括自定义提供商）
 * @returns {string} 模型名称
 */
export function getModelName(providerId, modelId) {
  // 如果 useAllProviders 为 true，则使用 getAllProviders 获取所有提供商
  // 否则只使用系统提供商
  const providerList = getAllProviders();
  const provider = providerList.find((p) => p.id === providerId);

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
  const allProviders = getAllProviders();
  const provider = allProviders.find((p) => p.id === providerId);
  return provider ? provider.models : [];
}

/**
 * 获取所有提供商（包括系统和自定义提供商）
 * @returns {Array} 所有提供商列表
 */
export const getAllProviders = () => {
  // 获取保存的提供商配置
  const savedProviderConfigs = getProvidersConfig();

  // 创建系统提供商的副本
  const allProviders = JSON.parse(JSON.stringify(providers));

  // 更新系统提供商的配置
  allProviders.forEach((provider) => {
    const savedConfig = savedProviderConfigs[provider.id];
    if (savedConfig) {
      // 如果有保存的配置，则使用保存的配置
      provider.apiKey = savedConfig.apiKey || "";
      provider.baseUrl = savedConfig.baseUrl || "";
      provider.enabled =
        savedConfig.enabled !== undefined ? savedConfig.enabled : false;

      // 更新模型的启用状态和删除状态
      if (savedConfig.models) {
        provider.models.forEach((model) => {
          const savedModel = savedConfig.models.find((m) => m.id === model.id);
          if (savedModel) {
            model.enabled =
              savedModel.enabled !== undefined ? savedModel.enabled : true;
            // 添加删除标志支持
            model.deleted = savedModel.deleted === true;
          } else {
            // 如果没有保存的模型配置，默认启用且未删除
            model.enabled = true;
            model.deleted = false;
          }
        });

        // 添加保存的模型中在系统模型中不存在的模型（可能是后来添加的）
        savedConfig.models.forEach((savedModel) => {
          const existingModel = provider.models.find(
            (m) => m.id === savedModel.id
          );
          if (!existingModel) {
            provider.models.push({
              id: savedModel.id,
              name: savedModel.name || savedModel.id,
              enabled:
                savedModel.enabled !== undefined ? savedModel.enabled : true,
              deleted: savedModel.deleted === true,
            });
          }
        });
      } else {
        // 如果没有保存的模型配置，默认所有模型都启用且未删除
        provider.models.forEach((model) => {
          model.enabled = true;
          model.deleted = false;
        });
      }
    } else {
      // 如果没有保存的配置，默认禁用提供商，但所有模型都启用且未删除
      provider.enabled = false;
      provider.models.forEach((model) => {
        model.enabled = true;
        model.deleted = false;
      });
    }
  });

  // 添加自定义提供商
  Object.keys(savedProviderConfigs).forEach((providerId) => {
    const providerConfig = savedProviderConfigs[providerId];
    if (providerConfig.isCustom) {
      const customProvider = {
        id: providerId,
        name: providerConfig.name,
        baseUrl: providerConfig.baseUrl,
        apiKey: providerConfig.apiKey,
        models: (providerConfig.models || []).map((model) => ({
          ...model,
          deleted: model.deleted === true,
        })),
        enabled:
          providerConfig.enabled !== undefined ? providerConfig.enabled : false,
        isCustom: true,
      };
      allProviders.push(customProvider);
    }
  });

  // 从结果中过滤掉标记为已删除的模型
  allProviders.forEach((provider) => {
    provider.models = provider.models.filter((model) => !model.deleted);
  });

  return allProviders;
};

// 初始化系统提供商配置
// 这段代码会在应用启动时执行，确保系统提供商被正确保存到配置中
if (typeof window !== "undefined") {
  // 获取当前保存的提供商配置
  const savedConfig = getProvidersConfig();
  let needsUpdate = false;

  // 检查每个系统提供商是否已经在配置中
  providers.forEach((provider) => {
    if (!savedConfig[provider.id]) {
      // 如果系统提供商不在配置中，添加它
      savedConfig[provider.id] = {
        ...provider,
        enabled: false, // 默认禁用
        models: provider.models.map((model) => ({
          ...model,
          enabled: true, // 默认启用所有模型
        })),
      };
      needsUpdate = true;
    } else {
      // 如果系统提供商已经在配置中，检查是否有新的模型需要添加
      const savedModels = savedConfig[provider.id].models || [];
      const savedModelIds = savedModels.map((m) => m.id);

      provider.models.forEach((model) => {
        if (!savedModelIds.includes(model.id)) {
          // 如果模型不在配置中，添加它
          savedModels.push({
            ...model,
            enabled: true, // 默认启用
          });
          needsUpdate = true;
        }
      });

      // 更新模型列表
      savedConfig[provider.id].models = savedModels;
    }
  });

  // 如果有更新，保存配置
  if (needsUpdate) {
    const configJson = JSON.stringify(savedConfig);
    localStorage.setItem("providersConfig", configJson);
    console.log("已初始化系统提供商配置");
  }
}
