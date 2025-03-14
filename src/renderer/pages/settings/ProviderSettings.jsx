import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Divider,
  Card,
  Typography,
  Space,
  Switch,
  Tag,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  MessageOutlined,
  CodeOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const ProviderSettings = ({
  initialProvider, // 重命名为initialProvider更清晰
  getProvidersConfig,
  saveProviderConfig,
  handleMenuSelect, // 保留在父组件的导航方法
  onProviderUpdate, // 用于通知父组件provider更新的回调
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  
  // 初始化表单和状态
  useEffect(() => {
    if (initialProvider) {
      setSelectedProvider(initialProvider);
      
      // 设置表单初始值
      form.setFieldsValue({
        apiKey: initialProvider.apiKey || "",
        baseUrl: initialProvider.baseUrl || "",
      });
    }
  }, [initialProvider, form]);

  if (!selectedProvider) {
    return <div>{t("settings.selectProvider")}</div>;
  }

  // 处理模型启用/禁用状态变更（移到组件内部）
  const handleModelChange = (modelId, enabled) => {
    if (!selectedProvider) {
      console.error("无法更新模型状态：selectedProvider为空");
      return;
    }

    // 创建提供商的副本
    const updatedProvider = { ...selectedProvider };

    // 更新模型的enabled状态
    updatedProvider.models = updatedProvider.models.map((model) => {
      if (model.id === modelId) {
        return { ...model, enabled };
      }
      return model;
    });

    // 更新状态
    setSelectedProvider(updatedProvider);

    // 保存到localStorage
    const providersConfig = getProvidersConfig();
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

    // 保存更新后的配置
    providersConfig[selectedProvider.id] = providerConfig;
    saveProviderConfig(providersConfig);

    // 通知父组件更新providers列表
    if (onProviderUpdate) {
      onProviderUpdate(updatedProvider);
    }

    // 显示提示
    message.success(
      `${enabled ? t("common.enable") : t("common.disable")} ${modelId} ${t(
        "common.success"
      )}`
    );
  };
  
  // 保存提供商配置（移到组件内部）
  const handleSaveProvider = () => {
    if (!selectedProvider) {
      console.error("无法保存：selectedProvider为空");
      return;
    }

    form
      .validateFields()
      .then((values) => {
        // 创建提供商配置
        const providersConfig = getProvidersConfig();
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

        // 保存配置
        providersConfig[selectedProvider.id] = providerConfig;
        saveProviderConfig(providersConfig);

        // 更新状态
        const updatedProvider = {
          ...selectedProvider,
          apiKey: values.apiKey,
          baseUrl: values.baseUrl,
        };
        setSelectedProvider(updatedProvider);

        // 通知父组件更新
        if (onProviderUpdate) {
          onProviderUpdate(updatedProvider);
        }

        message.success(t("settings.saveSuccess"));
        
        // 返回列表页面
        handleMenuSelect({ key: "model-services" });
      })
      .catch((error) => {
        console.error("保存失败:", error);
        message.error(
          t("common.save") + " " + t("common.failed") + ":" + error.message
        );
      });
  };

  // 渲染模型卡片
  const renderModelCard = (model) => {
    // 确保模型的enabled属性有一个明确的布尔值
    const isEnabled = model.enabled !== false; // 如果undefined或null，默认为true

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
        {selectedProvider.models.map((model) => renderModelCard(model))}
      </div>

      <div style={{ marginTop: "20px" }}>
        <Typography.Text type="secondary">
          <span style={{ marginRight: "8px" }}>ℹ️</span>
          {t("settings.modelSettingsHint")}
        </Typography.Text>
      </div>
    </div>
  );
};

export default ProviderSettings;
