import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  List,
  Select,
  Modal,
  message,
  Tooltip,
  Space,
  Alert,
  Tag,
  Spin,
  Badge,
  Typography,
  Divider,
  Popover,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  ToolOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import mcpService from "../../services/mcpService";

const { Option } = Select;
const { confirm } = Modal;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const MCPSettings = () => {
  const { t } = useTranslation();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [form] = Form.useForm();

  // 当前服务器类型
  const [serverType, setServerType] = useState("stdio");

  // 设置初始服务器类型
  useEffect(() => {
    const initialType = form.getFieldValue("type") || "stdio";
    setServerType(initialType);
  }, [modalVisible]);

  // 加载MCP服务器列表
  const loadServers = async () => {
    try {
      setLoading(true);
      const data = await mcpService.getAllServers();
      setServers(data);
    } catch (error) {
      console.error("加载MCP服务器列表失败", error);
      message.error(t("settings.loadServersFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  // 添加或更新服务器
  const handleSaveServer = async () => {
    try {
      const values = await form.validateFields();

      // 检查工具名称唯一性
      const isDuplicate = servers.some(
        (server) =>
          server.name === values.name &&
          (!editingServer || server.id !== editingServer.id)
      );

      if (isDuplicate) {
        message.error(t("settings.nameRequired"));
        return;
      }

      if (editingServer) {
        await mcpService.updateServer(editingServer.id, values);
        message.success(t("settings.serverUpdated"));
      } else {
        await mcpService.addServer(values);
        message.success(t("settings.serverAdded"));
      }

      setModalVisible(false);
      loadServers();
    } catch (error) {
      console.error("保存服务器失败:", error);
      message.error(t("settings.saveFailed"));
    }
  };

  // 删除服务器
  const handleDeleteServer = (server) => {
    confirm({
      title: t("settings.confirmDelete"),
      icon: <ExclamationCircleOutlined />,
      content: t("settings.deleteServerConfirm", { name: server.name }),
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await mcpService.deleteServer(server.id);
          message.success(t("settings.serverDeleted"));
          loadServers();
        } catch (error) {
          console.error("删除服务器失败:", error);
          message.error(t("settings.deleteFailed"));
        }
      },
    });
  };

  // 测试连接
  const testConnection = async (serverData, options = {}) => {
    try {
      // 如果没有传入serverData，则从表单获取
      if (!serverData) {
        const values = await form.validateFields(["url", "type", "apiKey"]);
        serverData = {
          ...values,
          id: editingServer?.id,
        };
      }

      if (!options.silent) {
        setTestingConnection(true);
        setTestResult(null);
      }

      const result = await mcpService.testConnection(serverData);

      // 如果是测试失败并且有ID，则更新服务器记录清空tools
      if (!result.success && serverData.id) {
        // 清空工具列表
        await mcpService.updateServer(serverData.id, { tools: [] });

        // 如果是通过toggleServerActive调用的，则不需要再次loadServers，
        // 因为toggleServerActive会处理
        if (!options.skipReload) {
          // 更新本地状态以立即反映变化
          setServers((prev) =>
            prev.map((s) => {
              if (s.id === serverData.id) {
                return { ...s, tools: [] };
              }
              return s;
            })
          );
        }
      }

      if (!options.silent) {
        setTestResult(result);
      }

      return result;
    } catch (error) {
      console.error("测试连接失败:", error);
      if (!options.silent) {
        message.error(t("settings.testFailed"));
      }
      return { success: false, message: error.message };
    } finally {
      if (!options.silent) {
        setTestingConnection(false);
      }
    }
  };

  // 切换服务器激活状态
  const toggleServerActive = async (server) => {
    try {
      // 如果要启用，先测试连接
      if (!server.active) {
        message.loading(t("settings.testingConnectionMsg"), 0);

        const testResult = await testConnection(
          {
            id: server.id,
            name: server.name,
            url: server.url,
            type: server.type,
            apiKey: server.api_key,
          },
          { silent: true, skipReload: true }
        );

        message.destroy();

        if (!testResult.success) {
          message.error(t("settings.connectionTestFailedMsg"));
          // 连接失败时，确保工具处于关闭状态（虽然本来就是关闭的）
          await mcpService.setServerActive(server.id, false);
          loadServers();
          return;
        }
      }

      // 更新服务器激活状态
      await mcpService.setServerActive(server.id, !server.active);
      loadServers();
      message.success(
        server.active
          ? t("settings.serverDeactivated")
          : t("settings.serverActivated")
      );
    } catch (error) {
      console.error("切换服务器状态失败:", error);
      message.error(t("settings.toggleActiveFailed"));
    }
  };

  // 刷新工具列表
  const refreshTools = async (server) => {
    form.resetFields();
    form.setFieldsValue({
      name: server.name,
      url: server.url,
      type: server.type,
      apiKey: server.api_key,
    });
    setEditingServer(server);
    message.loading(t("settings.refreshingToolsMsg"), 0);

    const result = await testConnection(
      {
        id: server.id,
        name: server.name,
        url: server.url,
        type: server.type,
        apiKey: server.api_key,
      },
      { silent: true }
    );

    message.destroy();

    if (result.success) {
      message.success(
        t("settings.toolsFoundSuccessMsg", { count: result.tools.length })
      );
      loadServers(); // 重新加载列表以显示更新的工具
    } else {
      message.error(
        t("settings.refreshToolsFailedMsg", { message: result.message })
      );
    }
  };

  // 打开添加/编辑模态框
  const openEditModal = (server = null) => {
    setEditingServer(server);
    form.resetFields();
    setTestResult(null);

    if (server) {
      form.setFieldsValue({
        name: server.name,
        url: server.url,
        type: server.type,
        apiKey: server.api_key,
        description: server.description,
      });
      // 更新服务器类型
      setServerType(server.type);
    } else {
      // 默认类型为stdio
      setServerType("stdio");
    }

    setModalVisible(true);
  };

  // 渲染工具提示内容
  const renderToolTooltip = (tools) => {
    if (!tools || tools.length === 0) {
      return t("settings.noToolsFound");
    }

    const toolNames = tools.map((tool) => tool.name).join(", ");
    return (
      <div style={{ maxWidth: 300 }}>
        <div>
          <strong>{t("settings.toolsTooltip", { toolNames })}</strong>
        </div>
        <Divider style={{ margin: "8px 0" }} />
        <div style={{ maxHeight: 200, overflow: "auto" }}>
          {tools.map((tool, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <div>
                <strong>{tool.name}</strong>
              </div>
              <div
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}
              >
                {tool.description || t("settings.noToolDescription")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染工具列表（测试结果使用）
  const renderToolList = (tools) => {
    if (!tools || tools.length === 0) {
      return <Alert message={t("settings.noToolsFound")} type="info" />;
    }

    return (
      <List
        size="small"
        dataSource={tools}
        renderItem={(tool) => (
          <List.Item>
            <List.Item.Meta
              avatar={<ToolOutlined />}
              title={tool.name}
              description={tool.description || t("settings.noToolDescription")}
            />
          </List.Item>
        )}
      />
    );
  };

  // 渲染工具标签列表
  const renderToolTags = (tools) => {
    if (!tools || tools.length === 0) {
      return null;
    }

    return (
      <div style={{ marginTop: 4 }}>
        {tools.map((tool, index) => (
          <Tooltip
            key={index}
            title={tool.description || t("settings.noToolDescription")}
          >
            <Tag style={{ marginBottom: 4 }} color="processing">
              <ToolOutlined style={{ marginRight: 4 }} />
              {tool.name}
            </Tag>
          </Tooltip>
        ))}
      </div>
    );
  };

  return (
    <div className="settings-content">
      <Card
        title={t("settings.mcpServers")}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openEditModal()}
          >
            {t("settings.addServer")}
          </Button>
        }
      >
        <Alert
          message={t("settings.mcpDescription")}
          description={t("settings.mcpDescriptionDetail")}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <List
          loading={loading}
          dataSource={servers}
          renderItem={(server) => (
            <List.Item
              actions={[
                <Tooltip
                  title={
                    server.active ? t("common.enabled") : t("common.disabled")
                  }
                >
                  <Switch
                    checked={server.active === 1}
                    onChange={() => toggleServerActive(server)}
                  />
                </Tooltip>,
                <Tooltip title={t("chat.mcpTools.refreshTools")}>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={() => refreshTools(server)}
                  />
                </Tooltip>,
                <Tooltip title={t("common.edit")}>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(server)}
                  />
                </Tooltip>,
                <Tooltip title={t("common.delete")}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteServer(server)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Space>
                    <Badge
                      status={
                        server.tools && server.tools.length > 0
                          ? "success"
                          : "default"
                      }
                      offset={[0, 0]}
                    >
                      <ApiOutlined style={{ fontSize: "24px" }} />
                    </Badge>
                    {
                      <Badge
                        status={
                          server.tools && server.tools.length > 0
                            ? "success"
                            : "error"
                        }
                        title={
                          server.tools && server.tools.length > 0
                            ? t("settings.toolsAvailable")
                            : t("settings.noToolsAvailable")
                        }
                      />
                    }
                  </Space>
                }
                title={
                  <Space>
                    <Text strong>{server.name}</Text>
                    <Tag color={server.type === "sse" ? "blue" : "green"}>
                      {server.type.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    <Text type="secondary">{server.url}</Text>
                    {server.description && (
                      <Text type="secondary">{server.description}</Text>
                    )}
                    {server.tools &&
                      server.tools.length > 0 &&
                      renderToolTags(server.tools)}
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: t("settings.noServersFound") }}
        />
      </Card>

      <Modal
        title={
          editingServer ? t("settings.editServer") : t("settings.addServer")
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
        footer={[
          <Button
            key="test"
            onClick={() => testConnection(null)}
            loading={testingConnection}
          >
            {t("settings.testConnection")}
          </Button>,
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveServer}>
            {t("common.save")}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if ("type" in changedValues) {
              setServerType(changedValues.type);
            }
          }}
        >
          <Form.Item
            name="name"
            label={t("settings.serverName")}
            rules={[
              { required: true, message: t("settings.nameRequired") },
              {
                pattern: /^[a-zA-Z0-9_-]+$/,
                message: t("settings.nameRequired"),
              },
            ]}
          >
            <Input placeholder={t("settings.toolNamePlaceholder")} />
          </Form.Item>

          <Form.Item name="description" label={t("settings.toolDescription")}>
            <TextArea
              placeholder={t("settings.toolDescriptionPlaceholder")}
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t("settings.serverType")}
            rules={[{ required: true, message: t("settings.typeRequired") }]}
            initialValue="stdio"
          >
            <Select>
              <Option value="stdio">{t("settings.stdioType")}</Option>
              <Option value="sse">{t("settings.sseType")}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="url"
            label={
              serverType === "stdio"
                ? t("settings.commandLabel")
                : t("settings.serverUrl")
            }
            rules={[{ required: true, message: t("settings.urlRequired") }]}
            tooltip={
              serverType === "stdio"
                ? t("settings.stdioUrlTooltip")
                : t("settings.sseUrlTooltip")
            }
          >
            <Input
              placeholder={
                serverType === "stdio"
                  ? "npx mcp-search"
                  : "http://localhost:3000/mcp"
              }
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={t("settings.apiKey")}
            tooltip={t("settings.apiKeyTooltip")}
          >
            <Input.Password placeholder={t("settings.apiKeyPlaceholder")} />
          </Form.Item>
        </Form>

        {testingConnection && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin tip={t("settings.testingConnection")} />
          </div>
        )}

        {testResult && !testingConnection && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message={
                testResult.success
                  ? t("settings.connectionSuccess")
                  : t("settings.connectionFailed")
              }
              description={
                testResult.success
                  ? t("settings.toolsFound", { count: testResult.tools.length })
                  : testResult.message
              }
              type={testResult.success ? "success" : "error"}
              showIcon
              icon={
                testResult.success ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )
              }
            />

            {testResult.success && testResult.tools.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">
                  {t("settings.availableTools")}
                </Divider>
                {renderToolList(testResult.tools)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MCPSettings;
