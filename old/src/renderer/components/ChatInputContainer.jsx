import React, { useState, useEffect } from "react";
import { Input, Button, Tooltip } from "antd";
import { SendOutlined, StopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

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
    const [isComposing, setIsComposing] = useState(false);
    const { t } = useTranslation();

    const handleSend = () => {
      if (!inputValue.trim()) return;
      onSendMessage(inputValue.trim());
      setInputValue(""); // 清空输入
    };

    // 监听输入法编辑状态
    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = () => {
      setIsComposing(false);
    };

    const handleKeyDown = (e) => {
      // 如果正在使用输入法，不处理Enter键
      if (isComposing) return;

      // 普通Enter发送消息（但不在输入法编辑状态时）
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="chat-input-container">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
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
