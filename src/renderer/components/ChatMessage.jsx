import React, { memo } from "react";
import { Avatar, Tooltip } from "antd";
import { UserOutlined, RobotOutlined, CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { message as antMessage } from "antd";

// 消息内容组件
const MessageContent = ({ content }) => {
  const { t } = useTranslation();

  // 如果内容是字符串，尝试解析为 JSON
  let parsedContent = content;
  if (typeof content === "string") {
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      // 如果解析失败，使用原始内容
      parsedContent = [{ type: "content", content }];
    }
  }

  // 复制代码到剪贴板的函数
  const copyCodeToClipboard = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        antMessage.success(t("chat.codeCopied"));
      })
      .catch((err) => {
        console.error("复制代码失败:", err);
        antMessage.error(t("chat.copyFailed"));
      });
  };

  // 处理链接点击事件，在外部浏览器中打开
  const handleLinkClick = (href, event) => {
    event.preventDefault();

    // 使用electronAPI在浏览器中打开链接
    window.electronAPI.openExternalURL(href).catch((err) => {
      console.error(t("about.openLinkFailed"), err);
      antMessage.error(`${t("about.openLinkFailed")} ${err.message}`);
    });
  };

  // 渲染 Markdown 内容，重点处理代码块
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const code = String(children).replace(/\n$/, "");

      return !inline && match ? (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-language">{language}</span>
            <Tooltip title={t("chat.copyCode")}>
              <button
                className="copy-code-button"
                onClick={() => copyCodeToClipboard(code)}
              >
                <CopyOutlined />
              </button>
            </Tooltip>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            {...props}
          >
            {code}
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

  // 主要内容
  const mainContent = parsedContent.find((item) => item.type === "content");
  const reasoningContent = parsedContent.find(
    (item) => item.type === "reasoning_content"
  );
  const toolCallsContent = parsedContent.find(
    (item) => item.type === "tool_calls"
  );

  const status =
    mainContent && mainContent.status
      ? mainContent.status
      : reasoningContent && reasoningContent.status
      ? reasoningContent.status
      : "success";

  return (
    <div>
      {/* 渲染主要内容 */}
      {mainContent && mainContent.content && (
        <div
          className={`message-text ${
            status === "error" ? "error-message" : ""
          }`}
        >
          <ReactMarkdown components={components}>
            {mainContent.content}
          </ReactMarkdown>
        </div>
      )}

      {/* 渲染推理内容（如果有） */}
      {reasoningContent && reasoningContent.content && (
        <div
          className={`reasoning-content ${
            reasoningContent.status ? reasoningContent.status : ""
          }`}
        >
          <ReactMarkdown components={components}>
            {reasoningContent.content}
          </ReactMarkdown>
        </div>
      )}

      {/* 渲染工具调用结果（如果有） */}
      {toolCallsContent && toolCallsContent.content && (
        <div className="tool-calls-content">
          {Array.isArray(toolCallsContent.content) ? (
            toolCallsContent.content.map((toolCall, index) => (
              <div key={index} className="tool-call-item">
                <div className="tool-call-name">
                  工具：{toolCall.name || "未知工具"}
                </div>
                <div className="tool-call-result">
                  <ReactMarkdown components={components}>
                    {toolCall.result || "无结果"}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <div>无工具调用结果</div>
          )}
        </div>
      )}
    </div>
  );
};

// 复制消息内容到剪贴板
const copyToClipboard = (content, t) => {
  // 提取纯文本内容
  let textContent = "";

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      const mainContent = parsed.find((item) => item.type === "content");
      if (mainContent && mainContent.content) {
        textContent = mainContent.content;
      }
    } catch (error) {
      textContent = content;
    }
  } else if (Array.isArray(content)) {
    const mainContent = content.find((item) => item.type === "content");
    if (mainContent && mainContent.content) {
      textContent = mainContent.content;
    }
  }

  // 复制到剪贴板
  navigator.clipboard
    .writeText(textContent)
    .then(() => {
      antMessage.success(t("chat.messageCopied"));
    })
    .catch((err) => {
      console.error("复制失败:", err);
      antMessage.error(t("chat.copyFailed"));
    });
};

// 消息项组件 - 使用memo优化渲染性能
const MessageItem = memo(({ message, style, getProviderAndModelInfo, t }) => {
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

  return (
    <div
      style={style} // 这个style属性是虚拟列表给的定位样式
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
                  e.target.parentNode.querySelector(".anticon").style.display =
                    "block";
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
          <div className="message-sender">
            {message.role === "user"
              ? t("chat.you")
              : modelInfo.providerName
              ? `${modelInfo.providerName} - ${modelInfo.modelName}`
              : t("settings.aiAssistant")}
          </div>
          <div className="message-time">
            {new Date(message.createdAt).toLocaleString()}
          </div>
        </div>
        <MessageContent content={message.parsedContent || message.content} />
        <div className="message-footer">
          <Tooltip title={t("chat.copyMessage")}>
            <button
              className="copy-button"
              onClick={() =>
                copyToClipboard(message.parsedContent || message.content, t)
              }
            >
              <CopyOutlined /> {t("chat.copy")}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

export default MessageItem;
