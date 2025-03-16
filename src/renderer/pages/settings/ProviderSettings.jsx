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
import { providerService } from "../../services/providerService";

const { Title, Text } = Typography;

const ProviderSettings = ({
  initialProvider,
  handleMenuSelect,
  onProviderUpdate,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [modelForm] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [isAddModelModalVisible, setIsAddModelModalVisible] = useState(false);
  const [isEditModelModalVisible, setIsEditModelModalVisible] = useState(false);
  const [currentEditModel, setCurrentEditModel] = useState(null);

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

    // 使用providerService启用/禁用模型
    const result = providerService.enableModel(
      selectedProvider.id,
      modelId,
      enabled
    );

    if (result.success) {
      // 更新本地状态
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

      // 通知父组件更新
      if (onProviderUpdate) {
        onProviderUpdate(updatedProvider);
      }
    } else {
      message.error(result.message || t("settings.updateModelFailed"));
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

      // 使用providerService添加模型
      const result = providerService.addModel(selectedProvider.id, {
        id: values.modelId,
        name: values.modelName || values.modelId,
        enabled: true,
      });

      if (result.success) {
        // 更新当前提供商
        const updatedProvider = providerService.getProviderById(
          selectedProvider.id
        );
        setSelectedProvider(updatedProvider);

        // 通知父组件更新
        if (onProviderUpdate) {
          onProviderUpdate(updatedProvider);
        }

        message.success(t("settings.addModelSuccess"));
        setIsAddModelModalVisible(false);
      } else {
        message.error(result.message || t("settings.addModelFailed"));
      }
    } catch (error) {
      console.error("添加模型失败:", error);
      message.error(t("settings.addModelFailed"));
    }
  };

  // 处理编辑模型
  const handleEditModel = async () => {
    if (!currentEditModel) return;

    try {
      const values = await modelForm.validateFields();

      // 使用providerService编辑模型
      const result = providerService.editModel(
        selectedProvider.id,
        currentEditModel.id,
        {
          id: values.modelId,
          name: values.modelName || values.modelId,
        }
      );

      if (result.success) {
        // 更新当前提供商
        const updatedProvider = providerService.getProviderById(
          selectedProvider.id
        );
        setSelectedProvider(updatedProvider);

        // 通知父组件更新
        if (onProviderUpdate) {
          onProviderUpdate(updatedProvider);
        }

        message.success(t("settings.editModelSuccess"));
        setIsEditModelModalVisible(false);
        setCurrentEditModel(null);
      } else {
        message.error(result.message || t("settings.editModelFailed"));
      }
    } catch (error) {
      console.error("编辑模型失败:", error);
      message.error(t("settings.editModelFailed"));
    }
  };

  // 处理删除模型
  const handleDeleteModel = (modelId) => {
    if (!selectedProvider) return;

    // 使用providerService删除模型
    const result = providerService.deleteModel(selectedProvider.id, modelId);

    if (result.success) {
      // 重新获取提供商以确保数据一致性
      const updatedProvider = providerService.getProviderById(
        selectedProvider.id
      );
      setSelectedProvider(updatedProvider);

      // 通知父组件更新
      if (onProviderUpdate) {
        onProviderUpdate(updatedProvider);
      }

      message.success(t("settings.deleteModelSuccess"));
    } else {
      message.error(result.message || t("settings.deleteModelFailed"));
    }
  };

  // 处理删除提供商
  const handleDeleteProvider = () => {
    if (!selectedProvider || !selectedProvider.isCustom) {
      message.error(t("settings.cannotDeleteSystemProvider"));
      return;
    }

    // 使用providerService删除提供商
    const result = providerService.deleteProvider(selectedProvider.id);

    if (result.success) {
      // 通知父组件更新
      if (onProviderUpdate) {
        // 传递null表示提供商已被删除
        onProviderUpdate(null);
      }

      message.success(t("settings.deleteProviderSuccess"));

      // 返回列表页面
      handleMenuSelect({ key: "model-services" });
    } else {
      message.error(result.message || t("settings.deleteProviderFailed"));
    }
  };

  // 处理保存提供商设置
  const handleSaveProvider = () => {
    if (!selectedProvider) {
      console.error("无法保存：selectedProvider为空");
      return;
    }

    form
      .validateFields()
      .then((values) => {
        // 使用providerService保存提供商设置
        const result = providerService.saveProviderSettings(
          selectedProvider.id,
          {
            apiKey: values.apiKey || "",
            baseUrl: values.baseUrl || "",
            // 如果是自定义提供商，保存isCustom标志和名称
            ...(selectedProvider.isCustom
              ? {
                  isCustom: true,
                  name: selectedProvider.name,
                }
              : {}),
          }
        );

        if (result.success) {
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
        } else {
          message.error(result.message || t("settings.saveFailed"));
        }
      })
      .catch((error) => {
        console.error("表单验证失败:", error);
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
            <span>{model.id}</span>
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
          <div className="model-status">
            <span className="model-name">{model.name}</span>
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
                  required: false,
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
            <Input placeholder="gpt-3.5-turbo" disabled />
          </Form.Item>
          <Form.Item name="modelName" label={t("settings.modelName")}>
            <Input placeholder={t("settings.modelNamePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProviderSettings;
