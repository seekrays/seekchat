/**
 * providerService.js
 * 提供商和模型统一管理服务
 * 整合所有提供商和模型的操作，提供统一的接口
 */

import { providers as systemProviders } from "./models.js";
import { getProvidersConfig, saveProviderConfig } from "../hooks/useUserConfig";
import { v4 as uuidv4 } from "uuid";
import i18n from "../i18n";

/**
 * 获取所有提供商（包括系统和自定义提供商）
 * @returns {Array} 所有提供商列表
 */
export const getAllProviders = () => {
  // 获取保存的提供商配置
  const savedProviderConfigs = getProvidersConfig();

  // 创建系统提供商的副本
  const allProviders = JSON.parse(JSON.stringify(systemProviders));

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
      if (savedConfig.models)
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
      if (savedConfig.models) {
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

/**
 * 获取启用的提供商列表
 * @returns {Array} 启用的提供商列表
 */
export const getEnabledProviders = () => {
  // 获取所有提供商（包括自定义提供商）
  const allProviders = getAllProviders();

  // 过滤出启用的提供商
  return allProviders.filter((provider) => provider.enabled !== false);
};

/**
 * 通过ID获取提供商
 * @param {string} providerId 提供商ID
 * @returns {Object|null} 提供商对象或null
 */
export const getProviderById = (providerId) => {
  const providers = getAllProviders();
  return providers.find((provider) => provider.id === providerId) || null;
};

/**
 * 启用或禁用提供商
 * @param {string} providerId 提供商ID
 * @param {boolean} enabled 是否启用
 * @returns {Object} 更新结果
 */
export const enableProvider = (providerId, enabled) => {
  try {
    const providersConfig = getProvidersConfig();
    if (!providersConfig[providerId]) {
      providersConfig[providerId] = { id: providerId };
    }

    providersConfig[providerId].enabled = enabled;

    const success = saveProviderConfig(providersConfig);
    return {
      success,
      message: success
        ? i18n.t(enabled ? "settings.enableSuccess" : "settings.disableSuccess")
        : i18n.t("settings.updateFailed"),
    };
  } catch (error) {
    console.error("启用/禁用提供商失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 保存提供商设置
 * @param {string} providerId 提供商ID
 * @param {Object} settings 提供商设置
 * @returns {Object} 更新结果
 */
export const saveProviderSettings = (providerId, settings) => {
  try {
    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[providerId] || {
      id: providerId,
      models: [],
    };

    // 更新提供商设置
    Object.keys(settings).forEach((key) => {
      providerConfig[key] = settings[key];
    });

    // 保存配置
    providersConfig[providerId] = providerConfig;
    const success = saveProviderConfig(providersConfig);

    return {
      success,
      message: success
        ? i18n.t("settings.saveSuccess")
        : i18n.t("settings.saveFailed"),
    };
  } catch (error) {
    console.error("保存提供商设置失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 添加自定义提供商
 * @param {Object} providerData 提供商数据
 * @returns {Object} 添加结果
 */
export const addCustomProvider = (providerData) => {
  try {
    const providerId = providerData.id || uuidv4();
    const providersConfig = getProvidersConfig();

    // 创建新的提供商配置
    providersConfig[providerId] = {
      id: providerId,
      name: providerData.name || "Custom Provider",
      baseUrl: providerData.baseUrl || "",
      apiKey: providerData.apiKey || "",
      models: providerData.models || [],
      isCustom: true,
      enabled:
        providerData.enabled !== undefined ? providerData.enabled : false,
    };

    const success = saveProviderConfig(providersConfig);

    return {
      success,
      providerId,
      message: success
        ? i18n.t("settings.addProviderSuccess")
        : i18n.t("settings.addProviderFailed"),
    };
  } catch (error) {
    console.error("添加自定义提供商失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 删除提供商
 * @param {string} providerId 提供商ID
 * @returns {Object} 删除结果
 */
export const deleteProvider = (providerId) => {
  try {
    // 检查是否是系统提供商
    const provider = getProviderById(providerId);
    if (provider && !provider.isCustom) {
      return {
        success: false,
        message: i18n.t("settings.cannotDeleteSystemProvider"),
      };
    }

    const providersConfig = getProvidersConfig();
    delete providersConfig[providerId];

    const success = saveProviderConfig(providersConfig);

    return {
      success,
      message: success
        ? i18n.t("settings.deleteProviderSuccess")
        : i18n.t("settings.deleteProviderFailed"),
    };
  } catch (error) {
    console.error("删除提供商失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 获取提供商的所有模型
 * @param {string} providerId 提供商ID
 * @returns {Array} 模型列表
 */
export const getProviderModels = (providerId) => {
  const provider = getProviderById(providerId);
  return provider ? provider.models : [];
};

/**
 * 启用或禁用模型
 * @param {string} providerId 提供商ID
 * @param {string} modelId 模型ID
 * @param {boolean} enabled 是否启用
 * @returns {Object} 更新结果
 */
export const enableModel = (providerId, modelId, enabled) => {
  try {
    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[providerId];

    if (!providerConfig) {
      return {
        success: false,
        message: i18n.t("settings.providerNotFound"),
      };
    }

    // 确保存在models数组
    if (!providerConfig.models) {
      providerConfig.models = [];
    }

    // 查找并更新模型
    let modelConfig = providerConfig.models.find((m) => m.id === modelId);

    if (modelConfig) {
      modelConfig.enabled = enabled;
    } else {
      // 如果模型不存在，添加它
      const provider = getProviderById(providerId);
      const model = provider
        ? provider.models.find((m) => m.id === modelId)
        : null;

      providerConfig.models.push({
        id: modelId,
        name: model ? model.name : modelId,
        enabled: enabled,
      });
    }

    // 保存配置
    const success = saveProviderConfig(providersConfig);

    return {
      success,
      message: success
        ? i18n.t(
            enabled
              ? "settings.enableModelSuccess"
              : "settings.disableModelSuccess"
          )
        : i18n.t("settings.updateModelFailed"),
    };
  } catch (error) {
    console.error("启用/禁用模型失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 添加模型到提供商
 * @param {string} providerId 提供商ID
 * @param {Object} modelData 模型数据
 * @returns {Object} 添加结果
 */
export const addModel = (providerId, modelData) => {
  try {
    if (!modelData.id) {
      return {
        success: false,
        message: i18n.t("settings.modelIdRequired"),
      };
    }

    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[providerId];

    if (!providerConfig) {
      return {
        success: false,
        message: i18n.t("settings.providerNotFound"),
      };
    }

    // 确保存在models数组
    if (!providerConfig.models) {
      providerConfig.models = [];
    }

    // 检查模型ID是否已存在
    if (providerConfig.models.some((m) => m.id === modelData.id)) {
      return {
        success: false,
        message: i18n.t("settings.modelAlreadyExists"),
      };
    }

    // 添加新模型
    const newModel = {
      id: modelData.id,
      name: modelData.name || modelData.id,
      enabled: modelData.enabled !== undefined ? modelData.enabled : true,
    };

    providerConfig.models.push(newModel);

    // 保存配置
    const success = saveProviderConfig(providersConfig);

    return {
      success,
      model: newModel,
      message: success
        ? i18n.t("settings.addModelSuccess")
        : i18n.t("settings.addModelFailed"),
    };
  } catch (error) {
    console.error("添加模型失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 编辑模型
 * @param {string} providerId 提供商ID
 * @param {string} modelId 模型ID
 * @param {Object} modelData 模型更新数据
 * @returns {Object} 更新结果
 */
export const editModel = (providerId, modelId, modelData) => {
  try {
    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[providerId];

    if (!providerConfig || !providerConfig.models) {
      return {
        success: false,
        message: i18n.t("settings.providerOrModelNotFound"),
      };
    }

    // 查找并更新模型
    const modelIndex = providerConfig.models.findIndex((m) => m.id === modelId);

    if (modelIndex === -1) {
      return {
        success: false,
        message: i18n.t("settings.modelNotFound"),
      };
    }

    // 创建更新后的模型对象
    const updatedModel = {
      ...providerConfig.models[modelIndex],
      ...modelData,
      id: modelData.id || modelId, // 确保ID存在
    };

    // 如果ID已更改，需要检查新ID是否已存在
    if (modelData.id && modelData.id !== modelId) {
      const existingModel = providerConfig.models.find(
        (m) => m.id === modelData.id
      );
      if (existingModel) {
        return {
          success: false,
          message: i18n.t("settings.modelIdAlreadyExists"),
        };
      }

      // 删除旧ID的模型
      providerConfig.models.splice(modelIndex, 1);

      // 添加新模型
      providerConfig.models.push(updatedModel);
    } else {
      // 直接更新模型
      providerConfig.models[modelIndex] = updatedModel;
    }

    // 保存配置
    const success = saveProviderConfig(providersConfig);

    return {
      success,
      model: updatedModel,
      message: success
        ? i18n.t("settings.editModelSuccess")
        : i18n.t("settings.editModelFailed"),
    };
  } catch (error) {
    console.error("编辑模型失败:", error);
    return { success: false, message: error.message };
  }
};

/**
 * 删除模型
 * @param {string} providerId 提供商ID
 * @param {string} modelId 模型ID
 * @returns {Object} 删除结果
 */
export const deleteModel = (providerId, modelId) => {
  try {
    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[providerId];

    if (!providerConfig || !providerConfig.models) {
      return {
        success: false,
        message: i18n.t("settings.providerOrModelNotFound"),
      };
    }

    // 查找模型
    const modelIndex = providerConfig.models.findIndex((m) => m.id === modelId);

    if (modelIndex === -1) {
      return {
        success: false,
        message: i18n.t("settings.modelNotFound"),
      };
    }

    // 检查是否是系统提供商
    const provider = getProviderById(providerId);
    const isSystemProvider = provider && !provider.isCustom;

    if (isSystemProvider) {
      // 对于系统提供商，标记模型为已删除而不是移除
      providerConfig.models[modelIndex].deleted = true;
    } else {
      // 对于自定义提供商，直接移除模型
      providerConfig.models.splice(modelIndex, 1);
    }

    // 保存配置
    const success = saveProviderConfig(providersConfig);

    return {
      success,
      message: success
        ? i18n.t("settings.deleteModelSuccess")
        : i18n.t("settings.deleteModelFailed"),
    };
  } catch (error) {
    console.error("删除模型失败:", error);
    return { success: false, message: error.message };
  }
};

// 初始化系统提供商配置
export const initializeProviders = () => {
  if (typeof window !== "undefined") {
    // 获取当前保存的提供商配置
    const savedConfig = getProvidersConfig();
    let needsUpdate = false;

    // 检查每个系统提供商是否已经在配置中
    systemProviders.forEach((provider) => {
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
      saveProviderConfig(savedConfig);
      console.log("已初始化系统提供商配置");
    }
  }
};

// 初始化提供商配置
initializeProviders();

// 导出统一的服务对象
export const providerService = {
  // 提供商操作
  getAllProviders,
  getEnabledProviders,
  getProviderById,
  enableProvider,
  saveProviderSettings,
  addCustomProvider,
  deleteProvider,

  // 模型操作
  getProviderModels,
  enableModel,
  addModel,
  editModel,
  deleteModel,

  // 配置管理
  getProvidersConfig,
  saveProviderConfig,
};

export default providerService;
