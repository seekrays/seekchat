import React, { useState } from "react";
import {
  DownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Spin, Tag, Typography } from "antd";

const { Text, Paragraph } = Typography;

/**
 * MCP工具调用组件
 * @param {Object} props 组件属性
 * @param {Object} props.toolCall 工具调用信息
 * @param {boolean} props.isCollapsed 是否折叠
 * @returns {JSX.Element} MCP工具调用组件
 */
const MCPToolCall = ({ toolCall, isCollapsed = false }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(isCollapsed);

  if (!toolCall) return null;

  const {
    tool_name,
    tool_id,
    parameters = {},
    result = {},
    status = "running",
  } = toolCall;

  // 增强的JSON格式化函数
  const formatJSON = (data) => {
    if (data === undefined || data === null) return "";

    try {
      // 如果是字符串，尝试解析为JSON
      if (typeof data === "string") {
        try {
          const parsedData = JSON.parse(data);
          return JSON.stringify(parsedData, null, 2);
        } catch (e) {
          // 不是有效的JSON字符串，直接返回原字符串
          return data;
        }
      }

      // 对象或数组，直接格式化
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("格式化JSON失败:", e);
      // 如果无法处理，转换为字符串返回
      return String(data);
    }
  };

  // 根据状态显示不同的图标
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "error":
        return <CloseCircleOutlined style={{ color: "#f5222d" }} />;
      case "running":
      default:
        return <LoadingOutlined style={{ color: "#1890ff" }} />;
    }
  };

  // 根据状态显示不同的文字
  const getStatusText = () => {
    switch (status) {
      case "success":
        return <Tag color="success">{t("chat.mcpTools.executionSuccess")}</Tag>;
      case "error":
        return <Tag color="error">{t("chat.mcpTools.executionFailed")}</Tag>;
      case "running":
      default:
        return <Tag color="processing">{t("chat.mcpTools.executing")}</Tag>;
    }
  };

  const toggleExpanded = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="mcp-tool-call">
      <div
        className="mcp-tool-call-header"
        onClick={toggleExpanded}
        style={{ cursor: "pointer" }}
      >
        {collapsed ? <RightOutlined /> : <DownOutlined />}
        <span className="mcp-tool-name">
          {t("chat.mcpTools.callMCPTool")} {getStatusIcon()}{" "}
          {tool_name || tool_id}
        </span>
        <div className="tool-calling-status">{getStatusText()}</div>
      </div>

      {!collapsed && (
        <div className="mcp-tool-call-details">
          <div className="mcp-tool-parameters">
            <Text strong>{t("chat.mcpTools.parameters")}:</Text>
            <Paragraph>
              <pre>{formatJSON(parameters)}</pre>
            </Paragraph>
          </div>

          <div className="mcp-tool-result">
            <Text strong>{t("chat.mcpTools.result")}:</Text>
            {status === "running" ? (
              <div className="tool-loading">
                <Spin size="small" /> {t("chat.mcpTools.waiting")}
              </div>
            ) : (
              <Paragraph>
                <pre>{formatJSON(result)}</pre>
              </Paragraph>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPToolCall;
