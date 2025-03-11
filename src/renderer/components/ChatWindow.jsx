import React, { useRef, memo, useState, useEffect } from "react";
import {
  Input,
  Button,
  Spin,
  Avatar,
  Tooltip,
  message,
  Select,
  Space,
  Collapse,
  Modal,
  Slider,
  InputNumber,
  Form,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  SettingOutlined,
  CopyOutlined,
  StopOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getModelName, getEnabledProviders } from "../services/aiService";
import { providers } from "../services/models";
import { useUserConfig } from "../hooks/useUserConfig";
import { useMessages } from "../hooks/useMessages";
import {
  parseMessageContent,
  formatMessageContent,
} from "../services/messageService";
import "../styles/ChatWindow.css";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Option, OptGroup } = Select;
const { Panel } = Collapse;

// 创建一个单独的 ChatInput 组件
const ChatInput = memo(
  ({
    inputValue,
    setInputValue,
    handleKeyPress,
    handleSendMessage,
    isSending,
    handleStopGeneration,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="chat-input-container">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("chat.typing")}
            autoSize={{ minRows: 1, maxRows: 5 }}
            disabled={isSending}
          />
          <div className="input-actions">
            {isSending ? (
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={handleStopGeneration}
                className="stop-button"
              >
                {t("chat.stop")}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="send-button"
              >
                {t("chat.send")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// 消息内容组件
const MessageContent = ({ content }) => {
  const { t } = useTranslation();

  // 如果内容是字符串，尝试解析为 JSON
  const parsedContent =
    typeof content === "string" ? parseMessageContent(content) : content;

  // 自定义渲染器，添加代码高亮功能
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // 如果解析后是数组，渲染多个内容块
  if (Array.isArray(parsedContent)) {
    // 找到主要内容（类型为 content）
    const mainContent = parsedContent.find((item) => item.type === "content");
    // console.log('mainContent', mainContent);
    // 找到思考内容（类型为 reasoning_content）
    const reasoningContent = parsedContent.find(
      (item) => item.type === "reasoning_content"
    );

    return (
      <div className="message-content-blocks">
        {/* 思考内容（可折叠） - 移到主要内容之前 */}
        {reasoningContent &&
          reasoningContent.content &&
          reasoningContent.content !== "" && (
            <Collapse
              ghost
              className="reasoning-collapse"
              defaultActiveKey={["1"]}
            >
              <Panel
                header={
                  <div className="reasoning-header">
                    <span>💡 {t("chat.reasoning")}</span>
                    {reasoningContent.status === "pending" && (
                      <Spin size="small" className="reasoning-spinner" />
                    )}
                  </div>
                }
                key="1"
              >
                <div className={`reasoning-content ${reasoningContent.status}`}>
                  {reasoningContent.status === "pending" ? (
                    <Spin size="small" />
                  ) : (
                    <ReactMarkdown components={renderers}>
                      {reasoningContent.content}
                    </ReactMarkdown>
                  )}
                </div>
              </Panel>
            </Collapse>
          )}

        {/* 主要内容 - 移到思考内容之后 */}
        {mainContent && mainContent.status !== "error" && (
          <div className="message-main-content">
            <ReactMarkdown components={renderers}>
              {mainContent.content}
            </ReactMarkdown>
            {mainContent.status === "pending" && mainContent.content && (
              <div className="message-pending-indicator">
                <Spin size="small" />
              </div>
            )}
          </div>
        )}

        {/* 错误内容 */}
        {mainContent && mainContent.status === "error" && (
          <div className="message-error-content">{mainContent.content}</div>
        )}

        {/* 如果没有内容，显示加载中 */}
        {!mainContent && !reasoningContent && <Spin size="small" />}
      </div>
    );
  }

  // 如果不是数组，直接渲染内容
  return (
    <ReactMarkdown components={renderers}>
      {typeof parsedContent === "string"
        ? parsedContent
        : formatMessageContent(parsedContent)}
    </ReactMarkdown>
  );
};

// 直接在前端实现复制功能
const copyToClipboard = (content, t) => {
  // 如果是字符串，尝试解析为JSON
  const parsedContent =
    typeof content === "string" ? parseMessageContent(content) : content;

  // 找到主要内容
  let textToCopy = "";
  if (Array.isArray(parsedContent)) {
    const mainContent = parsedContent.find((item) => item.type === "content");
    if (mainContent) {
      textToCopy = mainContent.content;
    }
  } else {
    textToCopy =
      typeof parsedContent === "string"
        ? parsedContent
        : formatMessageContent(parsedContent);
  }

  // 复制到剪贴板
  try {
    navigator.clipboard.writeText(textToCopy);
    message.success(t("chat.copiedToClipboard"));
  } catch (error) {
    console.error("copy failed:", error);
    message.error(
      t("chat.copyToClipboard") + t("common.failed") + ":" + error.message
    );

    // 回退方案：创建临时文本区域
    try {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      message.success(t("chat.copiedToClipboard"));
    } catch (fallbackError) {
      console.error("fallback copy failed:", fallbackError);
      message.error(
        t("chat.copyToClipboard") +
          t("common.failed") +
          ":" +
          fallbackError.message
      );
    }
  }
};

// 模型设置弹窗组件
const ModelSettingsModal = ({ visible, onCancel, onSave, initialSettings }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [temperature, setTemperature] = useState(0.7);
  const [contextLength, setContextLength] = useState(10);

  // 当弹窗打开时，设置表单的初始值
  useEffect(() => {
    if (visible && initialSettings) {
      // 设置默认值或使用会话中保存的值
      const defaultSettings = { temperature: 0.7, contextLength: 10 };
      const settings = { ...defaultSettings, ...initialSettings };

      console.log("settings modal initial settings:", settings);

      // 直接设置本地状态
      setTemperature(parseFloat(settings.temperature));
      setContextLength(settings.contextLength);

      // 设置表单值
      form.setFieldsValue({
        temperature: parseFloat(settings.temperature),
        contextLength: settings.contextLength,
      });
    }
  }, [visible, initialSettings, form]);

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        onSave(values);
        onCancel();
      })
      .catch((info) => {
        console.log("settings modal validation failed:", info);
      });
  };

  // 生成上下文长度选项
  const contextOptions = [
    { label: t("settings.unlimitedContext"), value: -1 },
    ...Array.from({ length: 20 }, (_, i) => ({
      label: `${i + 1} ${t("settings.messages")}`,
      value: i + 1,
    })),
  ];

  return (
    <Modal
      title={t("settings.modelSettings")}
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ temperature, contextLength }}
      >
        <Form.Item
          name="temperature"
          label={t("settings.temperature")}
          tooltip={t("settings.temperatureHint")}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Slider
              min={0}
              max={1}
              step={0.1}
              style={{ flex: 1, marginRight: 16 }}
              value={temperature}
              onChange={(value) => {
                setTemperature(value);
                form.setFieldsValue({ temperature: value });
              }}
            />
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              style={{ width: 70 }}
              value={temperature}
              onChange={(value) => {
                if (value !== null) {
                  setTemperature(value);
                  form.setFieldsValue({ temperature: value });
                }
              }}
            />
          </div>
        </Form.Item>

        <Form.Item
          name="contextLength"
          label={t("settings.contextLength")}
          tooltip={t("settings.contextLengthHint")}
        >
          <Select
            options={contextOptions}
            style={{ width: "100%" }}
            value={contextLength}
            onChange={(value) => {
              setContextLength(value);
              form.setFieldsValue({ contextLength: value });
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// 获取服务提供商和模型信息
const getProviderAndModelInfo = (providerId, modelId) => {
  // 查找提供商
  const provider = providers.find((p) => p.id === providerId);
  if (!provider)
    return {
      providerName: "AI助手",
      modelName: "未知模型",
      logo: null,
      providerId: "",
    };

  // 查找模型
  let modelName = "AI助手";
  const allModels = provider.models || [];
  const model = allModels.find((m) => m.id === modelId);

  if (model) {
    modelName = model.name;
  }

  return {
    providerName: provider.name,
    modelName: modelName,
    logo: provider.logo,
    providerId: provider.id,
  };
};

// 使用 memo 包装 ChatWindow 组件
const ChatWindow = memo(({ session, onUpdateSession }) => {
  const { t } = useTranslation();
  const { config, saveConfig } = useUserConfig();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sessionSettings, setSessionSettings] = useState(null);
  const electronAPI = window.electronAPI;
  const sessionIdRef = useRef(null);

  const {
    messages,
    inputValue,
    setInputValue,
    isSending,
    loading,
    messagesEndRef,
    chatContainerRef,
    handleSendMessage,
    handleKeyPress,
    loadMessages,
    handleStopGeneration,
  } = useMessages(session, sessionSettings);

  // 当会话变化时加载设置
  useEffect(() => {
    const loadSessionSettings = async () => {
      if (!session) {
        setSessionSettings(null);
        return;
      }

      // 设置当前会话ID引用
      sessionIdRef.current = session.id;

      // 从数据库获取最新的会话数据
      try {
        // 获取最新的会话数据
        const sessions = await electronAPI.getSessions();
        const freshSession = sessions.find((s) => s.id === session.id);

        if (!freshSession) {
          console.error(`找不到会话 ID: ${session.id}`);
          setSessionSettings({ temperature: 0.7, contextLength: 10 });
          return;
        }

        console.log("从数据库获取最新会话数据:", freshSession);

        // 尝试从会话元数据加载设置
        let metadata = {};
        if (freshSession.metadata) {
          metadata =
            typeof freshSession.metadata === "string" && freshSession.metadata
              ? JSON.parse(freshSession.metadata)
              : freshSession.metadata || {};
        }
        console.log("session metadata:", metadata);

        // 使用默认设置合并可能缺失的值
        const defaultSettings = { temperature: 0.7, contextLength: 10 };
        const mergedSettings = { ...defaultSettings, ...metadata };

        // 确保temperature是数字类型
        if (mergedSettings.temperature !== undefined) {
          mergedSettings.temperature = parseFloat(mergedSettings.temperature);
        }

        console.log(
          `session ${freshSession.id} load settings:`,
          mergedSettings
        );
        setSessionSettings(mergedSettings);
      } catch (error) {
        console.error("加载会话设置失败:", error);
        // 使用默认设置
        setSessionSettings({ temperature: 0.7, contextLength: 10 });
      }
    };

    loadSessionSettings();
  }, [session, electronAPI]);

  // 保存会话设置
  const saveSessionSettings = async (settings) => {
    if (!session) return;

    try {
      // 确保温度值是数字类型，只保存温度和上下文消息数量
      const processedSettings = {
        temperature: parseFloat(settings.temperature),
        contextLength: settings.contextLength,
      };

      console.log(`save session ${session.id} settings:`, processedSettings);
      await electronAPI.updateSessionMetadata(session.id, processedSettings);

      // 保存后立即从数据库重新加载最新设置
      const sessions = await electronAPI.getSessions();
      const freshSession = sessions.find((s) => s.id === session.id);

      if (freshSession && freshSession.metadata) {
        const metadata =
          typeof freshSession.metadata === "string" && freshSession.metadata
            ? JSON.parse(freshSession.metadata)
            : freshSession.metadata || {};

        const defaultSettings = { temperature: 0.7, contextLength: 10 };
        const mergedSettings = { ...defaultSettings, ...metadata };

        if (mergedSettings.temperature !== undefined) {
          mergedSettings.temperature = parseFloat(mergedSettings.temperature);
        }

        console.log(`重新加载会话设置:`, mergedSettings);
        setSessionSettings(mergedSettings);
      } else {
        // 直接使用当前设置
        setSessionSettings(processedSettings);
      }

      message.success(t("settings.saveSuccess"));
    } catch (error) {
      console.error("save session settings failed:", error);
      message.error(t("settings.saveFailed") + ":" + error.message);
    }
  };

  // 处理模型变更
  const handleModelChange = async (value) => {
    const [providerId, modelId] = value.split("|");

    // 更新配置
    const newConfig = { ...config, providerId, modelId };
    saveConfig(newConfig);

    // 显示提示
    message.success(
      `${t("chat.modelChanged")} ${getModelName(providerId, modelId)}`
    );
  };

  // 获取所有启用的提供商及其模型
  const getProviderModels = () => {
    const enabledProviders = getEnabledProviders();

    return enabledProviders
      .map((provider) => {
        // 确保provider.models存在且是数组
        if (!provider.models || !Array.isArray(provider.models)) {
          console.warn(`Provider ${provider.name} 没有有效的models数组`);
          return { provider, models: [] };
        }

        // 过滤出启用的模型
        const enabledModels = provider.models.filter((model) => {
          // 如果模型没有明确的enabled属性或者enabled为true，则认为是启用的
          return model.enabled !== false;
        });

        return {
          provider,
          models: enabledModels,
        };
      })
      .filter((item) => item.models.length > 0); // 只返回有启用模型的提供商
  };

  // 获取当前选择的模型
  const getCurrentModel = () => {
    if (!config.providerId || !config.modelId) return null;
    return `${config.providerId}|${config.modelId}`;
  };

  const providerModels = getProviderModels();

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">
          {session ? session.name : t("chat.startNewChat")}
        </div>
        <div className="chat-actions">
          <div className="model-selector">
            <Select
              value={getCurrentModel()}
              onChange={handleModelChange}
              placeholder={t("settings.modelServices")}
              style={{ width: 180 }}
              disabled={!session}
            >
              {providerModels.length > 0 ? (
                providerModels.map(({ provider, models }) => (
                  <OptGroup key={provider.id} label={provider.name}>
                    {models.map((model) => (
                      <Option
                        key={`${provider.id}|${model.id}`}
                        value={`${provider.id}|${model.id}`}
                      >
                        {model.name}
                      </Option>
                    ))}
                  </OptGroup>
                ))
              ) : (
                <Option disabled>{t("settings.noModelAvailable")}</Option>
              )}
            </Select>
          </div>

          <Tooltip title={t("settings.modelSettings")}>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              disabled={!session}
              style={{ marginLeft: 8 }}
            />
          </Tooltip>
        </div>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {loading ? (
          <div className="loading-container">
            <Spin tip={t("chat.loading")} />
          </div>
        ) : (
          <>
            {messages && messages.length > 0 ? (
              messages.map((msg) => {
                // 获取当前消息的AI模型信息
                const modelInfo =
                  msg.role === "assistant" && msg.providerId && msg.modelId
                    ? getProviderAndModelInfo(msg.providerId, msg.modelId)
                    : {
                        providerName: t("settings.aiAssistant"),
                        modelName: t("settings.aiAssistant"),
                        logo: null,
                        providerId: "",
                      };

                return (
                  <div
                    key={msg.id}
                    className={`message-item ${
                      msg.role === "user" ? "user-message" : "ai-message"
                    }`}
                  >
                    <div className="message-avatar">
                      {msg.role === "user" ? (
                        <Avatar
                          icon={<UserOutlined />}
                          className="user-avatar"
                        />
                      ) : (
                        <div className="ai-avatar">
                          {modelInfo.logo ? (
                            <img
                              src={modelInfo.logo}
                              alt={modelInfo.providerName}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentNode.querySelector(
                                  ".anticon"
                                ).style.display = "block";
                              }}
                            />
                          ) : null}
                          <RobotOutlined
                            style={{
                              display: modelInfo.logo ? "none" : "block",
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">
                          {msg.role === "user"
                            ? t("common.user")
                            : modelInfo.modelName}
                        </span>
                        {msg.role === "assistant" &&
                          modelInfo.providerName !==
                            t("common.aiAssistant") && (
                            <span className="message-provider">
                              {modelInfo.providerName}
                            </span>
                          )}
                        <span className="message-time">
                          {new Date(msg.createdAt).toLocaleString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </div>
                      <div className="message-text">
                        {msg.status === "pending" &&
                        (!msg.content ||
                          (typeof msg.content === "string" &&
                            JSON.parse(msg.content).find(
                              (item) => item.type === "content"
                            )?.content === "")) ? (
                          <Spin size="small" />
                        ) : msg.status === "error" ? (
                          <MessageContent content={msg.content} />
                        ) : (
                          <MessageContent content={msg.content} />
                        )}

                        <div className="message-footer">
                          <Tooltip title={t("chat.copyMessage")}>
                            <Button
                              type="text"
                              icon={<CopyOutlined />}
                              size="small"
                              onClick={() => copyToClipboard(msg.content, t)}
                              className="copy-button"
                            />
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-messages">
                <p>{t("chat.noMessages")}</p>
              </div>
            )}
            {/* 用于自动滚动的参考元素 */}
            <div
              ref={messagesEndRef}
              style={{ height: "1px", marginBottom: "20px" }}
            />
          </>
        )}
      </div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleKeyPress={handleKeyPress}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
        handleStopGeneration={handleStopGeneration}
      />

      {/* 设置弹窗 */}
      <ModelSettingsModal
        visible={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onSave={saveSessionSettings}
        initialSettings={sessionSettings}
      />
    </div>
  );
});

export default ChatWindow;
