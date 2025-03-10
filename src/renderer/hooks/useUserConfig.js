import React, { useState, useEffect } from "react";
import { providers } from "../services/models";

// 配置名称常量
const userConfigName = "user_config";
const providersConfigName = "providers_config";

// 默认用户配置
const defaultUserConfig = {
  theme: "light", // 默认主题
  language: "en", // 默认语言
  // 其他默认配置...
};

/**
 * 用户配置Hook，用于获取和管理用户配置
 * @returns {Object} 包含用户配置相关的状态和方法
 */
export const useUserConfig = () => {
  const [config, setConfig] = useState(() => getUserConfig());

  // 监听配置变化
  useEffect(() => {
    const handleStorageChange = () => {
      setConfig(getUserConfig());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 保存配置
  const saveConfig = (newConfig) => {
    const success = saveUserConfig(newConfig);
    if (success) {
      setConfig(newConfig);
    }
    return success;
  };

  // 更新语言设置
  const updateLanguage = (language) => {
    const newConfig = { ...config, language };
    return saveConfig(newConfig);
  };

  return {
    config,
    setConfig,
    saveConfig,
    getProvidersConfig,
    saveProviderConfig,
    clearAllConfig: () => {
      const success = clearAllConfig();
      if (success) {
        setConfig(defaultUserConfig);
      }
      return success;
    },
    updateLanguage,
  };
};

// 获取本地存储的配置
export const getUserConfig = () => {
  try {
    const configStr = localStorage.getItem(userConfigName);
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.error("获取用户配置失败:", error);
  }
  return { ...defaultUserConfig };
};

// 保存配置到本地存储
export const saveUserConfig = (config) => {
  try {
    localStorage.setItem(userConfigName, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error("保存用户配置失败:", error);
    return false;
  }
};

// 获取提供商配置
export const getProvidersConfig = () => {
  try {
    const providersJson = localStorage.getItem(providersConfigName);
    if (!providersJson) {
      console.log("localStorage中没有提供商配置，返回空对象");
      return {};
    }

    const savedConfig = JSON.parse(providersJson);

    // 检查savedConfig是否为数组，如果是则转换为对象
    if (Array.isArray(savedConfig)) {
      // console.log('从localStorage读取的提供商配置是数组，转换为对象');
      const configObj = {};
      savedConfig.forEach((provider) => {
        if (provider && provider.id) {
          configObj[provider.id] = provider;
        }
      });
      return configObj;
    }

    // 如果是对象，直接返回
    if (savedConfig && typeof savedConfig === "object") {
      // console.log('从localStorage读取的提供商配置:', savedConfig);
      return savedConfig;
    }

    console.error("从localStorage读取的提供商配置格式不正确");
    return {};
  } catch (error) {
    console.error("解析提供商配置失败:", error);
    return {};
  }
};

export const saveProviderConfig = (providersConfig) => {
  try {
    console.log("saveProviderConfig", providersConfig);
    // 确保providersConfig是对象而不是数组
    if (Array.isArray(providersConfig)) {
      console.error("providersConfig是数组，需要转换为对象");
      const configObj = {};
      providersConfig.forEach((provider) => {
        if (provider && provider.id) {
          configObj[provider.id] = provider;
        }
      });
      providersConfig = configObj;
    }

    // 检查providersConfig是否为空对象
    if (!providersConfig || Object.keys(providersConfig).length === 0) {
      console.error("providersConfig为空，无法保存");
      return false;
    }

    // 确保每个provider都有models属性
    Object.keys(providersConfig).forEach((providerId) => {
      const provider = providersConfig[providerId];
      if (!provider.models) {
        console.warn(`Provider ${providerId} 没有models属性，初始化为空数组`);
        provider.models = [];
      } else if (!Array.isArray(provider.models)) {
        console.warn(`Provider ${providerId} 的models不是数组，重置为空数组`);
        provider.models = [];
      }
    });

    // 保存到localStorage
    const configJson = JSON.stringify(providersConfig);
    localStorage.setItem(providersConfigName, configJson);
    console.log("保存提供商配置成功，数据大小:", configJson.length, "字节");
    console.log("保存的数据:", providersConfig);

    // 验证保存是否成功
    const savedJson = localStorage.getItem(providersConfigName);
    if (!savedJson) {
      console.error("保存后无法读取数据");
      return false;
    }

    return true;
  } catch (error) {
    console.error("保存提供商配置失败:", error);
    return false;
  }
};

// 清除所有配置
export const clearAllConfig = () => {
  try {
    localStorage.removeItem(userConfigName);
    localStorage.removeItem(providersConfigName);
    console.log("已清除所有配置");
    return true;
  } catch (error) {
    console.error("清除配置失败:", error);
    return false;
  }
};

// 初始化配置
if (typeof window !== "undefined") {
  if (!localStorage.getItem(userConfigName)) {
    saveUserConfig(getUserConfig());
  }

  // 初始化提供商配置
  if (!localStorage.getItem(providersConfigName)) {
    // 为每个提供商添加enabled字段，默认为false（禁用状态）
    const providersWithEnabled = providers.map((provider) => ({
      ...provider,
      enabled: false,
    }));
    localStorage.setItem(
      providersConfigName,
      JSON.stringify(providersWithEnabled)
    );
  } else {
    // 检查现有配置中是否有enabled字段，如果没有则添加
    const existingConfig = JSON.parse(
      localStorage.getItem(providersConfigName)
    );
    let needsUpdate = false;

    // 如果是数组形式
    if (Array.isArray(existingConfig)) {
      const updatedConfig = existingConfig.map((provider) => {
        if (provider.enabled === undefined) {
          needsUpdate = true;
          return { ...provider, enabled: false };
        }
        return provider;
      });

      if (needsUpdate) {
        localStorage.setItem(
          providersConfigName,
          JSON.stringify(updatedConfig)
        );
      }
    }
    // 如果是对象形式
    else if (typeof existingConfig === "object") {
      const updatedConfig = { ...existingConfig };
      let needsUpdate = false;

      Object.keys(updatedConfig).forEach((key) => {
        if (updatedConfig[key].enabled === undefined) {
          updatedConfig[key].enabled = false;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        localStorage.setItem(
          providersConfigName,
          JSON.stringify(updatedConfig)
        );
      }
    }
  }
}

/**
 * 检查是否已配置 AI 提供商和模型
 * @returns {boolean} 是否已配置
 */
export function isAIConfigured() {
  const config = getUserConfig();
  const providersConfig = getProvidersConfig();
  console.log("providersConfig", providersConfig);
  console.log("config", config);
  // 检查是否选择了提供商和模型
  if (!config.providerId || !config.modelId) {
    return false;
  }

  // 检查提供商是否存在且已启用
  const provider = providersConfig[config.providerId];
  if (!provider || provider.enabled === false) {
    return false;
  }

  // 检查模型是否存在
  const providerConfig = provider || {};

  // 检查 API 密钥是否已设置
  if (!providerConfig.apiKey && !providerConfig.mockResponse) {
    return false;
  }

  return true;
}
