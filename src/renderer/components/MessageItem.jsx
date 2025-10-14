import React, { memo, lazy } from "react";
import { Spin, Avatar, Tooltip, Button, Collapse, message } from "antd";
import { UserOutlined, RobotOutlined, CopyOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  parseMessageContent,
  formatMessageContent,
} from "../services/messageService";
import { useTranslation } from "react-i18next";

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

// 复制到剪贴板函数
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

// 使用memo包装消息项组件，避免不必要的重新渲染
const MessageItem = memo(
  ({ message, getProviderAndModelInfo, onVisibilityChange }) => {
    const { t } = useTranslation();

    // 获取当前消息的AI模型信息
    const modelInfo =
      message.role === "assistant" && message.providerId && message.modelId
        ? getProviderAndModelInfo(message.providerId, message.modelId)
        : {
            providerName: t("settings.aiAssistant"),
            modelName: t("settings.aiAssistant"),
            logo: null,
            providerId: "",
          };

    // 处理元素进入视图
    React.useEffect(() => {
      // 如果提供了可见性变化回调，调用它
      if (onVisibilityChange && typeof onVisibilityChange === "function") {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              onVisibilityChange(message.id, true);
            } else {
              onVisibilityChange(message.id, false);
            }
          },
          { threshold: 0.5 }
        );

        // 当前组件的DOM引用
        const element = document.getElementById(`message-${message.id}`);
        if (element) {
          observer.observe(element);
        }

        return () => {
          if (element) {
            observer.unobserve(element);
          }
        };
      }
    }, [message.id, onVisibilityChange]);

    return (
      <div
        id={`message-${message.id}`}
        className={`message-item ${
          message.role === "user" ? "user-message" : "ai-message"
        }`}
      >
        <div className="message-avatar">
          {message.role === "user" ? (
            <Avatar icon={<UserOutlined />} className="user-avatar" />
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
              {message.role === "user" ? t("common.user") : modelInfo.modelName}
            </span>
            {message.role === "assistant" &&
              modelInfo.providerName !== t("common.aiAssistant") && (
                <span className="message-provider">
                  {modelInfo.providerName}
                </span>
              )}
            <span className="message-time">
              {new Date(message.createdAt).toLocaleString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
          <div className="message-text">
            {message.status === "pending" &&
            (!message.content ||
              (typeof message.content === "string" &&
                JSON.parse(message.content).find(
                  (item) => item.type === "content"
                )?.content === "")) ? (
              <Spin size="small" />
            ) : (
              <MessageContent content={message.content} />
            )}

            <div className="message-footer">
              <Tooltip title={t("chat.copyMessage")}>
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copyToClipboard(message.content, t)}
                  className="copy-button"
                />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  },
  // 自定义比较函数，只有当消息内容或状态发生变化时才重新渲染
  (prevProps, nextProps) => {
    // 检查ID是否相同
    if (prevProps.message.id !== nextProps.message.id) {
      return false; // 不同消息，需要重新渲染
    }

    // 检查状态是否变化
    if (prevProps.message.status !== nextProps.message.status) {
      return false; // 状态变化，需要重新渲染
    }

    // 检查内容是否变化
    if (prevProps.message.content !== nextProps.message.content) {
      return false; // 内容变化，需要重新渲染
    }

    // 其他属性没有变化，不需要重新渲染
    return true;
  }
);

export default MessageItem;
