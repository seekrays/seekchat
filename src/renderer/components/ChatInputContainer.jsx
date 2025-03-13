import React, { useState } from "react";
import { Input, Button } from "antd";
import { SendOutlined, StopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MCPToolsButton from "./MCPToolsButton";

const { TextArea } = Input;

/**
 * 聊天输入容器组件
 * 独立管理输入状态，避免输入时触发整个聊天界面重新渲染
 *
 * @param {Object} props 组件属性
 * @param {Function} props.onSendMessage 发送消息回调
 * @param {Boolean} props.isSending 是否正在发送
 * @param {Function} props.onStopGeneration 停止生成回调
 * @returns {JSX.Element} 聊天输入组件
 */
const ChatInputContainer = React.memo(
  ({ onSendMessage, isSending, onStopGeneration }) => {
    const [inputValue, setInputValue] = useState("");
    const { t } = useTranslation();

    const handleSend = () => {
      if (!inputValue.trim()) return;
      onSendMessage(inputValue.trim());
      setInputValue(""); // 清空输入
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    // 处理MCP工具使用结果
    const handleToolUse = (toolResult) => {
      setInputValue((prev) => {
        if (!prev.trim()) return toolResult;
        return `${prev}\n\n${toolResult}`;
      });
    };

    return (
      <div className="chat-input-container">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
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
                onClick={onStopGeneration}
                className="stop-button"
              >
                {t("chat.stop")}
              </Button>
            ) : (
              <>
                <MCPToolsButton onToolUse={handleToolUse} />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="send-button"
                >
                  {t("chat.send")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default ChatInputContainer;
