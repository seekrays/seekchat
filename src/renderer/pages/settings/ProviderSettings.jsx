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
  Modal,
  Popconfirm,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  MessageOutlined,
  CodeOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

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
  const [modelForm] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [isAddModelModalVisible, setIsAddModelModalVisible] = useState(false);
  const [isEditModelModalVisible, setIsEditModelModalVisible] = useState(false);
  const [currentEditModel, setCurrentEditModel] = useState(null);
  const [currentModelId, setCurrentModelId] = useState(null);

  // 初始化表单和状态
  useEffect(() => {
    if (initialProvider) {
      // 确保过滤掉已删除的模型
      const filteredProvider = {
        ...initialProvider,
        models: initialProvider.models.filter((model) => !model.deleted),
      };

      setSelectedProvider(filteredProvider);

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

  const handleModelChange = (modelId, enabled) => {
    if (!selectedProvider) return;

    // 更新模型状态
    const updatedModels = selectedProvider.models.map((model) => {
      if (model.id === modelId) {
        return { ...model, enabled };
      }
      return model;
    });

    // 更新提供商状态
    const updatedProvider = {
      ...selectedProvider,
      models: updatedModels,
    };
    setSelectedProvider(updatedProvider);

    // 保存到配置
    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[selectedProvider.id] || {
      id: selectedProvider.id,
      models: [],
    };

    // 更新模型状态
    providerConfig.models = updatedModels.map((model) => ({
      id: model.id,
      enabled: model.enabled !== false,
      name: model.name,
    }));

    // 如果是自定义提供商，保存isCustom标志
    if (selectedProvider.isCustom) {
      providerConfig.isCustom = true;
      providerConfig.name = selectedProvider.name;
    }

    // 保存配置
    providersConfig[selectedProvider.id] = providerConfig;
    saveProviderConfig(providersConfig);

    // 通知父组件更新
    if (onProviderUpdate) {
      onProviderUpdate(updatedProvider);
    }
  };

  // 显示添加模型对话框
  const showAddModelModal = () => {
    setIsAddModelModalVisible(true);
    modelForm.resetFields();
  };

  // 显示编辑模型对话框
  const showEditModelModal = (model) => {
    setCurrentEditModel(model);
    setIsEditModelModalVisible(true);
    modelForm.setFieldsValue({
      modelId: model.id,
      modelName: model.name,
    });
  };

  // 处理添加模型
  const handleAddModel = async () => {
    try {
      const values = await modelForm.validateFields();

      // 创建新模型
      const newModel = {
        id: values.modelId,
        name: values.modelName || values.modelId,
        provider: selectedProvider.id,
        enabled: true,
      };

      // 更新提供商状态
      const updatedProvider = {
        ...selectedProvider,
        models: [...selectedProvider.models, newModel],
      };
      setSelectedProvider(updatedProvider);

      // 保存到配置
      const providersConfig = getProvidersConfig();
      const providerConfig = providersConfig[selectedProvider.id] || {
        id: selectedProvider.id,
        models: [],
      };

      // 更新模型列表
      providerConfig.models = updatedProvider.models.map((model) => ({
        id: model.id,
        enabled: model.enabled !== false,
        name: model.name,
      }));

      // 如果是自定义提供商，保存isCustom标志
      if (selectedProvider.isCustom) {
        providerConfig.isCustom = true;
        providerConfig.name = selectedProvider.name;
      }

      // 保存配置
      providersConfig[selectedProvider.id] = providerConfig;
      saveProviderConfig(providersConfig);

      // 通知父组件更新
      if (onProviderUpdate) {
        onProviderUpdate(updatedProvider);
      }

      message.success(t("settings.addModelSuccess"));
      setIsAddModelModalVisible(false);
    } catch (error) {
      console.error("添加模型失败:", error);
    }
  };

  // 处理编辑模型
  const handleEditModel = async () => {
    if (!currentEditModel) return;

    try {
      const values = await modelForm.validateFields();

      // 更新模型
      const updatedModels = selectedProvider.models.map((model) => {
        if (model.id === currentEditModel.id) {
          return {
            ...model,
            id: values.modelId,
            name: values.modelName || values.modelId,
          };
        }
        return model;
      });

      // 更新提供商状态
      const updatedProvider = {
        ...selectedProvider,
        models: updatedModels,
      };
      setSelectedProvider(updatedProvider);

      // 保存到配置
      const providersConfig = getProvidersConfig();
      const providerConfig = providersConfig[selectedProvider.id] || {
        id: selectedProvider.id,
        models: [],
      };

      // 更新模型列表
      providerConfig.models = updatedModels.map((model) => ({
        id: model.id,
        enabled: model.enabled !== false,
        name: model.name,
      }));

      // 如果是自定义提供商，保存isCustom标志
      if (selectedProvider.isCustom) {
        providerConfig.isCustom = true;
        providerConfig.name = selectedProvider.name;
      }

      // 保存配置
      providersConfig[selectedProvider.id] = providerConfig;
      saveProviderConfig(providersConfig);

      // 通知父组件更新
      if (onProviderUpdate) {
        onProviderUpdate(updatedProvider);
      }

      message.success(t("settings.editModelSuccess"));
      setIsEditModelModalVisible(false);
      setCurrentEditModel(null);
    } catch (error) {
      console.error("编辑模型失败:", error);
    }
  };

  // 处理删除模型
  const handleDeleteModel = (modelId) => {
    if (!selectedProvider) return;

    // 检查是否是系统供应商
    const isSystemProvider = !selectedProvider.isCustom;

    let updatedModels;

    if (isSystemProvider) {
      // 对于系统供应商，标记模型为已删除而不是移除
      updatedModels = selectedProvider.models.map((model) => {
        if (model.id === modelId) {
          return { ...model, deleted: true };
        }
        return model;
      });
    } else {
      // 对于自定义供应商，继续使用过滤方法删除
      updatedModels = selectedProvider.models.filter(
        (model) => model.id !== modelId
      );
    }

    // 更新提供商状态
    const updatedProvider = {
      ...selectedProvider,
      models: updatedModels,
    };
    setSelectedProvider(updatedProvider);

    // 保存到配置
    const providersConfig = getProvidersConfig();
    const providerConfig = providersConfig[selectedProvider.id] || {
      id: selectedProvider.id,
      models: [],
    };

    // 更新模型列表
    if (isSystemProvider) {
      // 对于系统供应商，保存所有模型，包括标记为删除的
      providerConfig.models = updatedModels.map((model) => ({
        id: model.id,
        enabled: model.enabled !== false,
        name: model.name,
        deleted: model.deleted === true,
      }));
    } else {
      // 对于自定义供应商，只保存未删除的模型
      providerConfig.models = updatedModels.map((model) => ({
        id: model.id,
        enabled: model.enabled !== false,
        name: model.name,
      }));
    }

    // 如果是自定义提供商，保存isCustom标志
    if (selectedProvider.isCustom) {
      providerConfig.isCustom = true;
      providerConfig.name = selectedProvider.name;
    }

    // 保存配置
    providersConfig[selectedProvider.id] = providerConfig;
    saveProviderConfig(providersConfig);

    // 通知父组件更新
    if (onProviderUpdate) {
      // 在UI中更新提供商，但过滤掉已删除的模型
      const uiProvider = {
        ...updatedProvider,
        models: updatedModels.filter((model) => !model.deleted),
      };
      onProviderUpdate(uiProvider);
    }

    message.success(t("settings.deleteModelSuccess"));
  };

  // 处理删除供应商
  const handleDeleteProvider = () => {
    if (!selectedProvider || !selectedProvider.isCustom) {
      console.error("无法删除：selectedProvider为空或不是自定义供应商");
      return;
    }

    console.log("开始删除供应商:", selectedProvider.id);

    try {
      // 从配置中删除供应商
      const providersConfig = getProvidersConfig();
      console.log("当前配置:", providersConfig);

      // 确保提供商存在于配置中
      if (providersConfig[selectedProvider.id]) {
        console.log("删除供应商:", selectedProvider.id);
        delete providersConfig[selectedProvider.id];
        console.log("删除后的配置:", providersConfig);

        // 保存更新后的配置
        const success = saveProviderConfig(providersConfig);
        console.log("保存结果:", success);

        if (success) {
          // 通知父组件更新
          if (onProviderUpdate) {
            console.log("通知父组件更新");
            onProviderUpdate(null);
          }

          message.success(t("settings.deleteProviderSuccess"));

          // 返回列表页面
          handleMenuSelect({ key: "model-services" });
        } else {
          console.error("删除供应商失败：保存配置返回false");
          message.error("删除供应商失败，请重试");
        }
      } else {
        console.warn("供应商不存在或已被删除:", selectedProvider.id);
        message.warning("供应商不存在或已被删除");
        handleMenuSelect({ key: "model-services" });
      }
    } catch (error) {
      console.error("删除供应商时发生错误:", error);
      message.error("删除供应商失败: " + error.message);
    }
  };

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

        // 如果是自定义提供商，保存isCustom标志和名称
        if (selectedProvider.isCustom) {
          providerConfig.isCustom = true;
          providerConfig.name = selectedProvider.name;
        }

        // 确保保存模型状态
        providerConfig.models = selectedProvider.models.map((model) => ({
          id: model.id,
          enabled: model.enabled !== false, // 确保undefined或null被视为true
          name: model.name,
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

    // 确定是否为聊天模型
    const isChatModel = model.name.toLowerCase().includes("chat");
    const modelIcon = isChatModel ? (
      <MessageOutlined
        style={{ fontSize: "14px", color: "#1677ff", marginRight: "8px" }}
      />
    ) : (
      <CodeOutlined
        style={{ fontSize: "14px", color: "#1677ff", marginRight: "8px" }}
      />
    );

    return (
      <Card
        key={model.id}
        className="model-card"
        size="small"
        title={
          <div className="model-card-title">
            {modelIcon}
            <span>{model.name}</span>
          </div>
        }
        extra={
          <div className="model-card-actions">
            <Switch
              size="small"
              checked={isEnabled}
              onChange={(checked) => {
                console.log(`Switch onChange: ${model.id}, checked=${checked}`);
                handleModelChange(model.id, checked);
              }}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              className="model-edit-button"
              onClick={(e) => {
                e.stopPropagation();
                showEditModelModal(model);
              }}
            />
            <Popconfirm
              title={t("settings.confirmDeleteModel")}
              onConfirm={() => handleDeleteModel(model.id)}
              okText={t("common.yes")}
              cancelText={t("common.no")}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </div>
        }
      >
        <div className="model-card-content">
          <div>{model.description || t("settings.modelDescription")}</div>
          <div className="model-status">
            {t("common.status")}:{" "}
            <Tag color={isEnabled ? "success" : "error"}>
              {isEnabled ? t("common.enabled") : t("common.disabled")}
            </Tag>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="provider-settings settings-content">
      <div className="provider-header">
        <div className="provider-header-left">
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
        {selectedProvider.isCustom && (
          <Popconfirm
            title={t("settings.confirmDeleteProvider")}
            onConfirm={handleDeleteProvider}
            okText={t("common.yes")}
            cancelText={t("common.no")}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t("settings.deleteProvider")}
            </Button>
          </Popconfirm>
        )}
      </div>

      <div className="provider-settings-container">
        <Card className="settings-card" title={t("settings.apiSettings")}>
          <Alert
            message={t("settings.apiSettingsInfo")}
            description={t("settings.apiSettingsDescription")}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form
            layout="vertical"
            form={form}
            onFinish={handleSaveProvider}
            initialValues={{
              apiKey: selectedProvider.apiKey || "",
              baseUrl: selectedProvider.baseUrl || "",
            }}
          >
            {/* API Base URL */}
            <Form.Item
              name="baseUrl"
              label={t("settings.apiBaseUrl")}
              rules={[
                {
                  required: true,
                  message: t("settings.baseUrlRequired"),
                },
              ]}
            >
              <Input placeholder={t("settings.enterApiBaseUrl")} />
            </Form.Item>

            {/* API Key */}
            <Form.Item
              name="apiKey"
              label={t("settings.apiKey")}
              rules={[
                {
                  required: true,
                  message: t("settings.apiKeyRequired"),
                },
              ]}
            >
              <Input.Password placeholder={t("settings.enterApiKey")} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                {t("common.save")}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card
          className="settings-card"
          title={t("settings.modelSettings")}
          extra={
            <Button
              type="primary"
              onClick={showAddModelModal}
              icon={<PlusOutlined />}
            >
              {t("settings.addModel")}
            </Button>
          }
        >
          <div className="settings-section">
            <Alert
              message={t("settings.modelSettingsHint")}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div className="models-card-container">
              {selectedProvider.models
                .filter((model) => !model.deleted)
                .map((model) => renderModelCard(model))}
            </div>
            {selectedProvider.models.filter((model) => !model.deleted)
              .length === 0 && (
              <div className="empty-models">
                <div className="empty-models-text">
                  {t("settings.noModelAvailable")}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Add Model Modal */}
      <Modal
        title={t("settings.addModel")}
        open={isAddModelModalVisible}
        onOk={handleAddModel}
        onCancel={() => setIsAddModelModalVisible(false)}
        destroyOnClose={true}
        maskClosable={false}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={modelForm} layout="vertical" className="model-form">
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
          <div className="model-form-tips">
            {t("settings.modelDescription")}
          </div>
        </Form>
      </Modal>

      {/* Edit Model Modal */}
      <Modal
        title={t("settings.editModel")}
        open={isEditModelModalVisible}
        onOk={handleEditModel}
        onCancel={() => {
          setIsEditModelModalVisible(false);
          setCurrentEditModel(null);
        }}
        destroyOnClose={true}
        maskClosable={false}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={modelForm} layout="vertical" className="model-form">
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
          <div className="model-form-tips">
            {t("settings.modelDescription")}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProviderSettings;
