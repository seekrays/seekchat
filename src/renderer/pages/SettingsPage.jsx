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
  getUserConfig,
} from "../hooks/useUserConfig";
import {
  providers as modelProviders,
  getAllProviders,
} from "../services/models";
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
  const [providers, setProviders] = useState([]); // 初始化为空数组，稍后通过 getAllProviders 获取

  // 初始化时加载提供商配置
  useEffect(() => {
    // 使用 getAllProviders 获取所有提供商（包括自定义提供商）
    const allProviders = getAllProviders();
    setProviders(allProviders);
    console.log("加载所有提供商:", allProviders);
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
    // 如果 updatedProvider 为 null，表示提供商已被删除
    if (!updatedProvider) {
      // 重新加载所有提供商
      const allProviders = getAllProviders();
      setProviders(allProviders);
      return;
    }

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
        const success = clearAllConfig();

        if (success) {
          // 显示成功消息
          message.success(t("settings.clearSuccess"));

          // 延迟500毫秒后刷新页面，确保配置完全清除
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          message.error("清除配置失败，请重试");
        }
      },
      onCancel() {
        // 用户取消操作
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
