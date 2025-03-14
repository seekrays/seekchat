import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Menu, Button, Form, message, Typography, Modal } from "antd";
import {
  ArrowLeftOutlined,
  ApiOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import {
  useUserConfig,
  getProvidersConfig,
  saveProviderConfig,
} from "../hooks/useUserConfig";
import { providers as modelProviders } from "../services/models";
import "../styles/SettingsPage.css";
import { useTranslation } from "react-i18next";

// 导入拆分后的组件
import ModelServices from "./settings/ModelServices";
import ProviderSettings from "./settings/ProviderSettings";
import GeneralSettings from "./settings/GeneralSettings";
import AboutSection from "./settings/AboutSection";
import MCPSettings from "./settings/MCPSettings";

const { Content, Header, Sider } = Layout;
const { Title } = Typography;

// 配置名称常量
const userConfigName = "user_config";
const providersConfigName = "providers_config";

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { config, saveConfig, clearAllConfig, updateLanguage } =
    useUserConfig();
  const [providersConfig, setProvidersConfig] = useState(getProvidersConfig());
  const [currentMenuKey, setCurrentMenuKey] = useState("model-services");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState(modelProviders); // 直接使用modelProviders

  // 初始化时加载提供商配置
  useEffect(() => {
    console.log("初始化时的modelProviders:", modelProviders);

    // 获取保存的提供商配置
    const savedProvidersConfig = getProvidersConfig();

    // 将保存的配置应用到providers上
    const updatedProviders = modelProviders.map((provider) => {
      const savedProvider = savedProvidersConfig[provider.id];

      if (savedProvider) {
        // 复制provider对象，避免直接修改原始对象
        const updatedProvider = { ...provider };

        // 更新apiKey和baseUrl
        if (savedProvider.apiKey) {
          updatedProvider.apiKey = savedProvider.apiKey;
        }

        if (savedProvider.baseUrl) {
          updatedProvider.baseUrl = savedProvider.baseUrl;
        }

        // 更新enabled状态
        if (savedProvider.enabled !== undefined) {
          updatedProvider.enabled = savedProvider.enabled;
        } else {
          updatedProvider.enabled = false; // 默认禁用
        }

        // 更新模型的enabled状态
        if (savedProvider.models) {
          updatedProvider.models = updatedProvider.models.map((model) => {
            const savedModel = savedProvider.models.find(
              (m) => m.id === model.id
            );
            if (savedModel && savedModel.enabled !== undefined) {
              return { ...model, enabled: savedModel.enabled };
            }
            return model;
          });
        }

        return updatedProvider;
      }

      // 如果没有保存的配置，确保有默认的enabled状态
      return { ...provider, enabled: false };
    });

    setProviders(updatedProviders);
  }, []);

  // 处理返回按钮点击
  const handleBack = () => {
    navigate("/");
  };

  // 处理菜单选择
  const handleMenuSelect = ({ key }) => {
    setCurrentMenuKey(key);
    setSelectedProvider(null);
  };

  // 处理选择提供商
  const handleSelectProvider = (provider) => {
    // 即使提供商被禁用，也允许进行配置
    console.log("选择提供商:", provider);
    setSelectedProvider(provider);
    setCurrentMenuKey("provider-settings");
  };

  // 处理提供商数据更新
  const handleProviderUpdate = (updatedProvider) => {
    // 更新providers列表中的对应提供商
    const updatedProviders = providers.map((provider) =>
      provider.id === updatedProvider.id ? updatedProvider : provider
    );
    setProviders(updatedProviders);
  };

  // 处理重置所有配置
  const handleResetAllConfig = () => {
    Modal.confirm({
      title: t("settings.clearConfigConfirm"),
      icon: <ExclamationCircleOutlined />,
      content: "这将清除所有用户配置和提供商配置，恢复到默认状态。",
      onOk() {
        // 清除所有配置
        clearAllConfig();

        // 显示成功消息
        message.success(t("settings.clearSuccess"));

        // 重新加载页面
        window.location.reload();
      },
      onCancel() {
        // 取消操作
      },
    });
  };

  // 根据当前菜单渲染内容
  const renderContent = () => {
    switch (currentMenuKey) {
      case "model-services":
        return (
          <ModelServices
            providers={providers}
            providersConfig={providersConfig}
            saveProviderConfig={saveProviderConfig}
            handleSelectProvider={handleSelectProvider}
            onProvidersChange={setProviders}
          />
        );
      case "provider-settings":
        return (
          <ProviderSettings
            initialProvider={selectedProvider}
            getProvidersConfig={getProvidersConfig}
            saveProviderConfig={saveProviderConfig}
            handleMenuSelect={handleMenuSelect}
            onProviderUpdate={handleProviderUpdate}
          />
        );
      case "general-settings":
        return (
          <GeneralSettings
            config={config}
            saveConfig={saveConfig}
            updateLanguage={updateLanguage}
            handleResetAllConfig={handleResetAllConfig}
          />
        );
      case "about":
        return <AboutSection />;
      case "mcp-settings":
        return <MCPSettings />;
      default:
        return <div>未知设置页面</div>;
    }
  };

  const navigate = useNavigate();

  return (
    <Layout className="settings-page">
      <Header className="settings-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="back-button"
        >
          {t("common.back")}
        </Button>
        <Title level={4} className="settings-title">
          {t("settings.title")}
        </Title>
      </Header>
      <Layout className="settings-layout">
        <Sider width={200} className="settings-sider">
          <Menu
            mode="inline"
            selectedKeys={[currentMenuKey]}
            onSelect={handleMenuSelect}
            className="settings-menu"
          >
            <Menu.Item key="model-services" icon={<ApiOutlined />}>
              {t("settings.modelServices")}
            </Menu.Item>
            <Menu.Item key="mcp-settings" icon={<ThunderboltOutlined />}>
              {t("settings.mcpSettings")}
            </Menu.Item>
            <Menu.Item key="general-settings" icon={<SettingOutlined />}>
              {t("settings.general")}
            </Menu.Item>
            <Menu.Item key="about" icon={<InfoCircleOutlined />}>
              {t("common.about")}
            </Menu.Item>
          </Menu>
        </Sider>
        <Content className="settings-main-content">{renderContent()}</Content>
      </Layout>
    </Layout>
  );
};

export default SettingsPage;
