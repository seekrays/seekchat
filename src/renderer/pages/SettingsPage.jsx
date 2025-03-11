import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  Form,
  Input,
  Select,
  Slider,
  InputNumber,
  Switch,
  Space,
  Typography,
  Card,
  message,
  Divider,
  List,
  Avatar,
  Badge,
  Tag,
  Row,
  Col,
  Statistic,
  Tooltip,
  Radio,
  Modal,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  ApiOutlined,
  SettingOutlined,
  GlobalOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ClearOutlined,
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

const { Content, Header, Sider } = Layout;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

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
  const [form] = Form.useForm();
  const [generalForm] = Form.useForm();
  const navigate = useNavigate();

  // 初始化时加载提供商配置
  useEffect(() => {
    console.log("初始化时的modelProviders:", modelProviders);

    // 获取保存的提供商配置
    const savedProvidersConfig = getProvidersConfig();
    // console.log('从localStorage读取的提供商配置:', savedProvidersConfig);

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

  // 当选择提供商时，确保显示正确的模型状态
  useEffect(() => {
    if (selectedProvider) {
      const savedProvidersConfig = getProvidersConfig();
      const savedProvider = savedProvidersConfig[selectedProvider.id];

      if (savedProvider) {
        // 更新选中的提供商，确保模型状态正确
        const updatedProvider = { ...selectedProvider };

        // 更新模型的enabled状态
        if (savedProvider.models) {
          updatedProvider.models = updatedProvider.models.map((model) => {
            const savedModel = savedProvider.models.find(
              (m) => m.id === model.id
            );
            if (savedModel !== undefined && savedModel.enabled !== undefined) {
              return { ...model, enabled: savedModel.enabled };
            }
            return model;
          });
        }

        setSelectedProvider(updatedProvider);
      }
    }
  }, [selectedProvider?.id]);

  // 初始化通用设置表单
  useEffect(() => {
    generalForm.setFieldsValue({
      language: config.language || "en",
    });
  }, [config, generalForm]);

  // 处理表单值变化
  const handleFormValueChange = (changedValues, allValues) => {
    // 更新配置
    const newConfig = { ...config, ...allValues };
    saveConfig(newConfig);
  };

  // 处理语言变更
  const handleLanguageChange = (language) => {
    updateLanguage(language);
    i18n.changeLanguage(language);
    message.success(t("settings.saveSuccess"));
  };

  // 处理模型启用/禁用状态变更
  const handleModelChange = (modelId, enabled) => {
    if (!selectedProvider) {
      console.error("无法更新模型状态：selectedProvider为空");
      return;
    }

    console.log(`更新模型状态: ${modelId}, enabled=${enabled}`);

    // 创建提供商的副本
    const updatedProvider = { ...selectedProvider };

    // 更新模型的enabled状态
    updatedProvider.models = updatedProvider.models.map((model) => {
      if (model.id === modelId) {
        return { ...model, enabled };
      }
      return model;
    });

    console.log("更新后的provider:", updatedProvider);

    // 更新状态
    setSelectedProvider(updatedProvider);

    // 保存到localStorage
    const providersConfig = getProvidersConfig();
    // console.log('当前providersConfig:', providersConfig);

    const providerConfig = providersConfig[selectedProvider.id] || {
      id: selectedProvider.id,
      apiKey: selectedProvider.apiKey || "",
      baseUrl: selectedProvider.baseUrl || "",
      models: [],
    };

    // 更新模型状态
    providerConfig.models = updatedProvider.models.map((model) => ({
      id: model.id,
      enabled: model.enabled,
    }));

    console.log("更新后的providerConfig:", providerConfig);

    // 保存更新后的配置
    providersConfig[selectedProvider.id] = providerConfig;
    const saveResult = saveProviderConfig(providersConfig);
    console.log("保存结果:", saveResult);

    // 更新providers列表中的对应提供商
    const updatedProviders = providers.map((provider) =>
      provider.id === updatedProvider.id ? updatedProvider : provider
    );
    setProviders(updatedProviders);

    // 显示提示
    message.success(
      `${enabled ? t("common.enable") : t("common.disable")} ${modelId} ${t(
        "common.success"
      )}`
    );
  };

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

    // 重置表单
    form.resetFields();

    // 设置表单初始值
    form.setFieldsValue({
      apiKey: provider.apiKey || "",
      baseUrl: provider.baseUrl || "",
    });
  };

  // 处理提供商启用/禁用状态变更
  const handleProviderEnabledChange = (providerId, enabled) => {
    console.log("handleProviderEnabledChange", providerId, enabled);
    // 更新providers状态
    const updatedProviders = providers.map((provider) => {
      if (provider.id === providerId) {
        return { ...provider, enabled };
      }
      return provider;
    });
    console.log("updatedProviders", updatedProviders);
    setProviders(updatedProviders);

    // 更新providersConfig状态
    const updatedConfig = { ...providersConfig };
    if (!updatedConfig[providerId]) {
      updatedConfig[providerId] = {};
    }
    console.log("updatedConfig", updatedConfig);
    console.log("providerId", providerId, "enabled", enabled);
    updatedConfig[providerId].enabled = enabled;
    // console.log('updatedConfig', updatedConfig);
    setProvidersConfig(updatedConfig);

    // 保存到localStorage
    saveProviderConfig(updatedConfig);

    // 显示提示
    message.success(
      `${enabled ? t("common.enable") : t("common.disable")} ${t(
        "common.success"
      )}`
    );
  };

  // 渲染服务提供商列表
  const renderProviderList = () => {
    return (
      <div className="provider-list-container">
        <Title level={4}>{t("settings.selectProvider")}</Title>
        <Paragraph>{t("settings.selectProviderHint")}</Paragraph>

        <div className="provider-grid">
          {providers && providers.length > 0 ? (
            providers.map((provider) => (
              <div
                key={provider.id}
                className={`provider-grid-item ${
                  !provider.enabled ? "provider-disabled" : ""
                }`}
              >
                <div
                  className="provider-content"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div className="provider-logo-container">
                    <img
                      src={provider.logo || "assets/providers/openai.png"}
                      alt={provider.name}
                      className="provider-logo"
                      onError={(e) => {
                        e.target.src = "";
                      }}
                    />
                  </div>
                  <div className="provider-info">
                    <div className="provider-name">{provider.name}</div>
                    <div className="provider-model-count">
                      {provider.models.length} {t("common.models")}
                    </div>
                  </div>
                </div>
                <div
                  className="provider-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={provider.enabled !== false}
                    onChange={(checked) =>
                      handleProviderEnabledChange(provider.id, checked)
                    }
                    checkedChildren={t("common.enable")}
                    unCheckedChildren={t("common.disable")}
                  />
                </div>
              </div>
            ))
          ) : (
            <div>{t("settings.noProvidersAvailable")}</div>
          )}
        </div>
      </div>
    );
  };

  // 渲染服务提供商设置
  const renderProviderSettings = () => {
    if (!selectedProvider) {
      return <div>{t("settings.selectProvider")}</div>;
    }

    return (
      <div className="provider-settings">
        <div className="provider-header">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleMenuSelect({ key: "model-services" })}
          >
            {t("common.back")}
          </Button>
          <h2>
            {selectedProvider.name} {t("common.settings")}
          </h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            apiKey: selectedProvider.apiKey || "",
            baseUrl: selectedProvider.baseUrl || "",
          }}
        >
          <Form.Item
            name="apiKey"
            label={t("settings.apiKey")}
            rules={[{ required: true, message: "API Key是必须的" }]}
          >
            <Input.Password placeholder={t("settings.apiKey")} />
          </Form.Item>

          <Form.Item name="baseUrl" label={t("settings.baseUrl")}>
            <Input placeholder={t("settings.baseUrl")} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveProvider}
              >
                {t("common.save")}
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider orientation="left">{t("settings.modelSettings")}</Divider>

        <div className="models-container">
          {selectedProvider.models.map((model) =>
            renderModelCard(model, selectedProvider)
          )}
        </div>

        <div style={{ marginTop: "20px" }}>
          <Typography.Text type="secondary">
            <InfoCircleOutlined style={{ marginRight: "8px" }} />
            {t("settings.modelSettingsHint")}
          </Typography.Text>
        </div>
      </div>
    );
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

  // 渲染模型卡片
  const renderModelCard = (model, provider) => {
    // 确保模型的enabled属性有一个明确的布尔值
    const isEnabled = model.enabled !== false; // 如果undefined或null，默认为true

    // console.log(`渲染模型卡片: ${model.id}, enabled=${model.enabled}, isEnabled=${isEnabled}`);

    return (
      <Card
        key={model.id}
        className="model-card"
        size="small"
        variant={true}
        extra={
          <Switch
            size="small"
            checked={isEnabled}
            onChange={(checked) => {
              console.log(`Switch onChange: ${model.id}, checked=${checked}`);
              handleModelChange(model.id, checked);
            }}
          />
        }
        title={
          <div className="model-card-title">
            {model.name.toLowerCase().includes("chat") ? (
              <MessageOutlined
                style={{
                  fontSize: "14px",
                  color: "#1677ff",
                  marginRight: "8px",
                }}
              />
            ) : (
              <CodeOutlined
                style={{
                  fontSize: "14px",
                  color: "#1677ff",
                  marginRight: "8px",
                }}
              />
            )}
            <span>{model.name}</span>
          </div>
        }
      >
        <div className="model-card-content">
          <div>{model.description || t("settings.modelDescription")}</div>
          <div className="model-status">
            {t("common.status")}:{" "}
            <Tag color={isEnabled ? "green" : "red"}>
              {isEnabled ? t("common.enabled") : t("common.disabled")}
            </Tag>
          </div>
        </div>
      </Card>
    );
  };

  // 保存提供商配置
  const handleSaveProvider = () => {
    if (!selectedProvider) {
      console.error("无法保存：selectedProvider为空");
      return;
    }

    // console.log('开始保存提供商配置，selectedProvider:', selectedProvider);

    form
      .validateFields()
      .then((values) => {
        // console.log('表单验证通过，values:', values);

        // 创建提供商配置
        const providersConfig = getProvidersConfig();
        // console.log('当前providersConfig:', providersConfig);

        const providerConfig = providersConfig[selectedProvider.id] || {
          id: selectedProvider.id,
          models: [],
        };

        // 更新apiKey和baseUrl
        providerConfig.apiKey = values.apiKey || "";
        providerConfig.baseUrl = values.baseUrl || "";

        // 确保保存模型状态
        providerConfig.models = selectedProvider.models.map((model) => ({
          id: model.id,
          enabled: model.enabled !== false, // 确保undefined或null被视为true
        }));

        // console.log('更新后的providerConfig:', providerConfig);

        // 保存配置
        providersConfig[selectedProvider.id] = providerConfig;
        const saveResult = saveProviderConfig(providersConfig);
        // console.log('保存结果:', saveResult);

        // 更新状态
        const updatedProvider = {
          ...selectedProvider,
          apiKey: values.apiKey,
          baseUrl: values.baseUrl,
        };
        setSelectedProvider(updatedProvider);

        // 更新providers列表中的对应提供商
        const updatedProviders = providers.map((provider) =>
          provider.id === updatedProvider.id ? updatedProvider : provider
        );
        setProviders(updatedProviders);

        message.success(t("settings.saveSuccess"));
        // 返回列表页面
        setSelectedProvider(null);
        setCurrentMenuKey("model-services"); // 设置回服务商列表视图
      })
      .catch((error) => {
        console.error("保存失败:", error);
        message.error(
          t("common.save") + " " + t("common.failed") + ":" + error.message
        );
      });
  };

  // 渲染通用设置内容
  const renderGeneralSettings = () => {
    return (
      <div className="settings-content">
        <Card title={t("settings.general")} bordered={false}>
          <Form
            form={generalForm}
            layout="vertical"
            onValuesChange={handleFormValueChange}
            initialValues={{ language: config.language || "en" }}
          >
            <Form.Item
              name="language"
              label={t("settings.language")}
              tooltip={t("settings.language")}
            >
              <Select
                onChange={handleLanguageChange}
                options={[
                  { value: "en", label: t("language.en") },
                  { value: "zh-CN", label: t("language.zh-CN") },
                ]}
              />
            </Form.Item>
          </Form>
        </Card>

        <Card className="settings-card" style={{ marginTop: 16 }}>
          <div className="settings-section">
            <Title level={5}>{t("settings.clearConfig")}</Title>
            <Paragraph>{t("settings.clearConfigHint")}</Paragraph>
            <Button
              type="primary"
              danger
              icon={<ClearOutlined />}
              onClick={handleResetAllConfig}
            >
              {t("settings.clearConfig")}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  // 渲染关于页面
  const renderAbout = () => {
    return (
      <div className="about-section settings-content">
        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img
                src="assets/logo/logo.png"
                alt="SeekChat Logo"
                style={{ width: 80, height: 80 }}
              />
              <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>
                SeekChat
              </Title>
              <Text type="secondary">{t("about.version")}: 0.0.1</Text>
              <div style={{ marginTop: 8 }}>
                <Text>{t("about.officialWebsite")}： chat.seekrays.com</Text>
              </div>
            </div>

            <Divider />

            <Title level={4}>
              {t("common.about")} {t("common.seekChat")}
            </Title>
            <Paragraph>{t("about.aboutDescription")}</Paragraph>

            <Title level={4}>{t("about.feature")}</Title>
            <ul>
              <li>{t("about.features.multipleProviders")}</li>
              <li>{t("about.features.multiLanguage")}</li>
              <li>{t("about.features.localStorage")}</li>
              <li>{t("about.features.simpleInterface")}</li>
            </ul>
          </Space>
        </Card>
      </div>
    );
  };

  // 根据当前菜单渲染内容
  const renderContent = () => {
    switch (currentMenuKey) {
      case "model-services":
        return renderProviderList();
      case "provider-settings":
        return renderProviderSettings();
      case "general-settings":
        return renderGeneralSettings();
      case "about":
        return renderAbout();
      default:
        return <div>未知设置页面</div>;
    }
  };

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
