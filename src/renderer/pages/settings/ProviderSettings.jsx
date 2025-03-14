import React from "react";
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
  form,
  selectedProvider,
  handleMenuSelect,
  handleSaveProvider,
  handleModelChange,
}) => {
  const { t } = useTranslation();

  if (!selectedProvider) {
    return <div>{t("settings.selectProvider")}</div>;
  }

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
