import React, { useState, useEffect } from "react";
import { Switch, Typography, message, Button, Modal, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { PlusOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { saveProviderConfigById } from "../../hooks/useUserConfig";

const { Title, Paragraph } = Typography;

const ModelServices = ({
  providers: initialProviders,
  providersConfig,
  saveProviderConfig,
  handleSelectProvider,
  onProvidersChange,
}) => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState(initialProviders);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setProviders(initialProviders);
  }, [initialProviders]);

  const handleProviderEnabledChange = (providerId, enabled) => {
    const updatedProviders = providers.map((provider) => {
      if (provider.id === providerId) {
        return { ...provider, enabled };
      }
      return provider;
    });

    setProviders(updatedProviders);

    if (onProvidersChange) {
      onProvidersChange(updatedProviders);
    }

    const updatedConfig = { ...providersConfig };
    if (!updatedConfig[providerId]) {
      updatedConfig[providerId] = {};
    }
    updatedConfig[providerId].enabled = enabled;

    saveProviderConfig(updatedConfig);

    message.success(
      `${enabled ? t("common.enable") : t("common.disable")} ${t(
        "common.success"
      )}`
    );
  };

  // 显示添加供应商对话框
  const showAddModal = () => {
    setIsAddModalVisible(true);
    form.resetFields();
  };

  // 处理添加供应商
  const handleAddProvider = async () => {
    try {
      const values = await form.validateFields();

      // 生成唯一ID
      const providerId = `custom_${uuidv4().substring(0, 8)}`;

      // 创建新的供应商对象
      const newProvider = {
        id: providerId,
        name: values.name,
        baseUrl: values.baseUrl,
        apiKey: values.apiKey,
        models: [
          {
            id: values.modelId,
            name: values.modelName || values.modelId,
            provider: providerId,
            enabled: true,
          },
        ],
        enabled: true,
        isCustom: true,
      };

      // 保存到本地存储
      saveProviderConfigById(providerId, newProvider);

      // 更新状态
      const updatedProviders = [...providers, newProvider];
      setProviders(updatedProviders);

      if (onProvidersChange) {
        onProvidersChange(updatedProviders);
      }

      message.success(t("settings.addProviderSuccess"));
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("添加供应商失败:", error);
    }
  };

  return (
    <div className="provider-list-container">
      <div className="provider-header">
        <div>
          <Title level={4}>{t("settings.selectProvider")}</Title>
          <Paragraph>{t("settings.selectProviderHint")}</Paragraph>
        </div>
      </div>

      <div className="provider-grid">
        {providers && providers.length > 0 ? (
          <>
            {providers.map((provider) => (
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
                    {provider.logo ? (
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="provider-logo"
                        onError={(e) => {
                          e.target.style.display = "none";
                          // 显示首字母
                          const textElement = e.target.parentNode.querySelector(
                            ".provider-logo-text"
                          );
                          if (textElement) {
                            textElement.style.display = "flex";
                          }
                        }}
                      />
                    ) : (
                      <div className="provider-logo-text">
                        {provider.name.charAt(0).toUpperCase()}
                      </div>
                    )}
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
            ))}
            {/* 添加供应商按钮作为最后一个卡片 */}
            <div
              className="provider-grid-item add-provider-item"
              onClick={showAddModal}
            >
              <div className="add-provider-content">
                <PlusOutlined className="add-icon" />
                <div className="add-text">{t("settings.addProvider")}</div>
              </div>
            </div>
          </>
        ) : (
          <div>{t("settings.noProvidersAvailable")}</div>
        )}
      </div>

      {/* 添加供应商对话框 */}
      <Modal
        title={t("settings.addCustomProvider")}
        open={isAddModalVisible}
        onOk={handleAddProvider}
        onCancel={() => setIsAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t("settings.providerName")}
            rules={[
              { required: true, message: t("settings.providerNameRequired") },
            ]}
          >
            <Input placeholder={t("settings.providerNamePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="baseUrl"
            label={t("settings.baseUrl")}
            rules={[{ required: true, message: t("settings.baseUrlRequired") }]}
          >
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label={t("settings.apiKey")}
            rules={[{ required: true, message: t("settings.apiKeyRequired") }]}
          >
            <Input.Password placeholder={t("settings.apiKeyPlaceholder")} />
          </Form.Item>
          <Form.Item
            name="modelId"
            label={t("settings.modelId")}
            rules={[{ required: true, message: t("settings.modelIdRequired") }]}
          >
            <Input placeholder="gpt-3.5-turbo" />
          </Form.Item>
          <Form.Item name="modelName" label={t("settings.modelName")}>
            <Input placeholder={t("settings.modelNamePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ModelServices;
