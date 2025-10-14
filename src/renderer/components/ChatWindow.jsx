import {
  CopyOutlined,
  RobotOutlined,
  SettingOutlined
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Slider,
  Spin,
  Tooltip
} from "antd";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useMessages } from "../hooks/useMessages";
import { useUserConfig } from "../hooks/useUserConfig";
import { getEnabledProviders } from "../services/aiService";
import {
  formatMessageContent,
  parseMessageContent,
} from "../services/messageService";
import { getAllProviders, getModelName } from "../services/models";
import "../styles/ChatWindow.css";
import ChatInputContainer from "./ChatInputContainer";
import MessageItem from "./MessageItem";

const { TextArea } = Input;
const { Option, OptGroup } = Select;
const { Panel } = Collapse;

// 消息内容组件
const MessageContent = ({ content }) => {
  const { t } = useTranslation();

  // 如果内容是字符串，尝试解析为 JSON
  const parsedContent =
    typeof content === "string" ? parseMessageContent(content) : content;

  // 复制代码到剪贴板
  const copyCodeToClipboard = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        message.success(t("chat.codeCopied"));
      })
      .catch((error) => {
        console.error("复制代码失败:", error);
        message.error(t("chat.copyToClipboard") + t("common.failed"));
      });
  };

  // 处理链接点击事件，在外部浏览器中打开
  const handleLinkClick = (href, event) => {
    event.preventDefault();

    // 使用electronAPI在浏览器中打开链接
    window.electronAPI.openExternalURL(href).catch((err) => {
      console.error(t("about.openLinkFailed"), err);
      message.error(`${t("about.openLinkFailed")} ${err.message}`);
    });
  };

  // 自定义渲染器，添加代码高亮功能
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "text";
      const codeString = String(children).replace(/\n$/, "");

      return !inline && match ? (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-language">{language}</span>
            <Tooltip title={t("chat.copyCode")}>
              <Button
                type="text"
                icon={<CopyOutlined />}
                className="code-copy-button"
                onClick={() => copyCodeToClipboard(codeString)}
              />
            </Tooltip>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    // 自定义链接渲染，设置为在外部浏览器打开
    a({ node, href, children, ...props }) {
      return (
        <a
          href={href}
          onClick={(event) => handleLinkClick(href, event)}
          style={{ color: "#1890ff", textDecoration: "underline" }}
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  // 如果解析后是数组，渲染多个内容块
  if (Array.isArray(parsedContent)) {
    // 找到主要内容（类型为 content）
    const mainContent = parsedContent.find((item) => item.type === "content");
    // 找到思考内容（类型为 reasoning_content）
    const reasoningContent = parsedContent.find(
      (item) => item.type === "reasoning_content"
    );
    // 找到工具调用内容（类型为 tool_calls）
    const toolCallsContent = parsedContent.find(
      (item) => item.type === "tool_calls"
    );
    console.log("toolCallsContent:", toolCallsContent);

    // 导入MCP工具调用组件
    const MCPToolCall = lazy(() => import("./MCPToolCall"));

    return (
      <div className="message-content-blocks">
        {/* 思考内容（可折叠） - 移到主要内容之前 */}
        {reasoningContent &&
          reasoningContent.content &&
          reasoningContent.content !== "" && (
            <Collapse
              ghost
              className="reasoning-collapse"
              defaultActiveKey={[]}
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
                    <ReactMarkdown components={renderers} remarkPlugins={[remarkGfm]}>
                      {reasoningContent.content}
                    </ReactMarkdown>
                  )}
                </div>
              </Panel>
            </Collapse>
          )}
        {/* 工具调用内容 */}
        {toolCallsContent &&
          toolCallsContent.content &&
          Array.isArray(toolCallsContent.content) && (
            <div className="tool-calls-container">
              {toolCallsContent.status === "receiving" && (
                <div className="tool-calling-status">
                  <Spin size="small" />
                  <span>{t("chat.mcpTools.executingTools")}</span>
                </div>
              )}
              {toolCallsContent.content.map((toolCall, index) => (
                <React.Suspense
                  key={toolCall.id || index}
                  fallback={<Spin size="small" />}
                >
                  <MCPToolCall toolCall={toolCall} isCollapsed={true} />
                </React.Suspense>
              ))}
            </div>
          )}
        {/* 主要内容 - 移到思考内容之后 */}
        {mainContent && mainContent.status !== "error" && (
          <div className="message-main-content">
            <ReactMarkdown components={renderers} remarkPlugins={[remarkGfm]}>
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
        {!mainContent && !reasoningContent && !toolCallsContent && (
          <Spin size="small" />
        )}
      </div>
    );
  }

  // 如果不是数组，直接渲染内容
  return (
    <ReactMarkdown components={renderers} remarkPlugins={[remarkGfm]}>
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
  // 获取所有供应商（包括系统和自定义供应商）
  const allProviders = getAllProviders();

  // 查找提供商
  const provider = allProviders.find((p) => p.id === providerId);
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

  // 跟踪可见消息ID，用于优化滚动和渲染
  const [visibleMessageIds, setVisibleMessageIds] = useState({});

  const {
    messages,
    isSending,
    loading,
    messagesEndRef,
    chatContainerRef,
    handleSendMessage,
    loadMessages,
    handleStopGeneration,
    scrollToBottom,
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

  // 监听消息列表变化，自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // 使用requestAnimationFrame确保在下一次渲染周期执行滚动
      requestAnimationFrame(() => {
        scrollToBottom();
        console.log("消息更新后自动滚动到底部");
      });
    }
  }, [messages.length, loading, scrollToBottom]);

  // 处理消息可见性变化
  const handleMessageVisibilityChange = useCallback((messageId, isVisible) => {
    if (isVisible) {
      setVisibleMessageIds((prev) => ({ ...prev, [messageId]: true }));
    } else {
      setVisibleMessageIds((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
    }
  }, []);

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
      `${t("chat.modelChanged", {
        model: getModelName(providerId, modelId),
      })}`
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

        // 过滤出启用的且未删除的模型
        const enabledModels = provider.models.filter((model) => {
          // 如果模型没有明确的enabled属性或者enabled为true，并且未被删除，则认为是可用的
          return model.enabled !== false && model.deleted !== true;
        });

        return {
          provider,
          models: enabledModels,
        };
      })
      .filter((item) => item.models.length > 0); // 只返回有启用模型的提供商
  };
  const providerModels = getProviderModels();

  // 获取当前选择的模型
  const getCurrentModel = () => {
    // 首先检查配置中是否有providerId和modelId
    if (!config.providerId || !config.modelId) return null;
    // 检查当前选择的提供商是否存在于可用提供商列表中
    const provider = providerModels.find(
      (item) => item.provider.id === config.providerId
    );
    if (!provider) return null;

    // 检查当前选择的模型是否存在于可用模型列表中
    const modelExists = provider.models.some(
      (model) => model.id === config.modelId
    );
    if (!modelExists) return null;

    // 只有当提供商和模型都存在且启用时，才返回完整的选择值
    return `${config.providerId}|${config.modelId}`;
  };

  // 检查当前选中的模型是否可用，如果不可用则选择第一个可用模型
  useEffect(() => {
    // 只有当没有可用模型时才返回
    if (providerModels.length === 0) return;

    // 如果用户没有选择模型或选择的模型/提供商不可用，自动选择一个默认模型
    if (!config.providerId || !config.modelId) {
      // 当用户初始化没有选择模型时，自动选择第一个可用模型
      if (providerModels.length > 0 && providerModels[0].models.length > 0) {
        const firstProvider = providerModels[0];
        const firstModel = firstProvider.models[0];
        handleModelChange(`${firstProvider.provider.id}|${firstModel.id}`);
        console.log(`初始化自动选择模型: ${firstModel.name}`);
      }
      return;
    }

    // 检查当前选择的提供商是否存在于可用提供商列表中
    const provider = providerModels.find(
      (item) => item.provider.id === config.providerId
    );

    // 如果提供商不存在或没有模型，选择第一个可用模型
    if (!provider) {
      // 如果有可用的提供商和模型，选择第一个
      if (providerModels.length > 0 && providerModels[0].models.length > 0) {
        const firstProvider = providerModels[0];
        const firstModel = firstProvider.models[0];
        handleModelChange(`${firstProvider.provider.id}|${firstModel.id}`);
        console.log(`自动选择了第一个可用模型: ${firstModel.name}`);
      }
      return;
    }

    // 检查当前选择的模型是否存在于可用模型列表中
    const modelExists = provider.models.some(
      (model) => model.id === config.modelId
    );

    // 如果模型不存在，选择该提供商的第一个可用模型
    if (!modelExists) {
      if (provider.models.length > 0) {
        const firstModel = provider.models[0];
        handleModelChange(`${provider.provider.id}|${firstModel.id}`);
        console.log(`当前模型不可用，自动选择了: ${firstModel.name}`);
      } else if (
        providerModels.length > 0 &&
        providerModels[0].models.length > 0
      ) {
        // 如果该提供商没有可用模型，选择第一个可用的提供商的第一个模型
        const firstProvider = providerModels[0];
        const firstModel = firstProvider.models[0];
        handleModelChange(`${firstProvider.provider.id}|${firstModel.id}`);
        console.log(`自动选择了第一个可用模型: ${firstModel.name}`);
      }
    }
  }, [config.providerId, config.modelId, providerModels, handleModelChange]);

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
              <div className="message-list">
                {messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    getProviderAndModelInfo={getProviderAndModelInfo}
                    onVisibilityChange={handleMessageVisibilityChange}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-messages">
                <div className="empty-message-icon">
                  <RobotOutlined style={{ fontSize: 48, opacity: 0.5 }} />
                </div>
                <div className="empty-message-text">{t("chat.noMessages")}</div>
              </div>
            )}
            {/* 仍需保留引用元素但不使其可见 */}
            <div
              ref={messagesEndRef}
              style={{ height: "1px", marginBottom: "20px" }}
            />
          </>
        )}
      </div>

      <ChatInputContainer
        onSendMessage={handleSendMessage}
        isSending={isSending}
        onStopGeneration={handleStopGeneration}
      />

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
