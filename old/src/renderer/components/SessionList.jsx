import React, { useState } from "react";
import {
  List,
  Button,
  Input,
  Modal,
  Popconfirm,
  Tooltip,
  Empty,
  Badge,
  message,
  Menu,
  Dropdown,
} from "antd";
import {
  MessageOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  RobotOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "../styles/SessionList.css";
import { useTranslation } from "react-i18next";

// 使用preload.js中暴露的API
const electronAPI = window.electronAPI;

const SessionList = ({
  sessions,
  currentSession,
  onSelectSession,
  onDeleteSession,
  onSessionListUpdate,
}) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // 过滤会话列表
  const filteredSessions = sessions.filter((session) =>
    session.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 确认删除
  const confirmDelete = (sessionId, sessionName) => {
    Modal.confirm({
      title: t("chat.clearChatConfirm", { sessionName }),
      icon: <ExclamationCircleOutlined />,
      okType: "danger",
      content: t("chat.clearChatConfirmContent"),

      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      onOk() {
        handleDeleteSession(sessionId);
      },
    });
  };

  // 删除会话
  const handleDeleteSession = async (sessionId) => {
    try {
      await electronAPI.deleteSession(sessionId);
      // 删除会话后，删除对应的messages
      await electronAPI.deleteMessages(sessionId);

      // 刷新会话列表
      const sessionList = await electronAPI.getSessions();
      if (typeof onSessionListUpdate === "function") {
        onSessionListUpdate(sessionList);
      }

      // 通知父组件
      if (typeof onDeleteSession === "function") {
        onDeleteSession(sessionId);
      }

      message.success(t("chat.deleteChat") + t("common.success"));
    } catch (error) {
      console.error("删除会话失败:", error);
      message.error(t("chat.deleteChat") + t("common.failed"));
    }
  };

  // 打开编辑名称模态框
  const showRenameModal = (session) => {
    setEditingSession(session);
    setSessionName(session.name);
    setIsModalVisible(true);
  };

  // 保存会话名称
  const handleRenameSession = async () => {
    if (!editingSession || !sessionName.trim()) return;

    try {
      await electronAPI.updateSessionName(
        editingSession.id,
        sessionName.trim()
      );

      // 直接重新加载所有会话，确保列表更新
      const sessionList = await electronAPI.getSessions();

      // 更新会话列表
      if (typeof onSessionListUpdate === "function") {
        onSessionListUpdate(sessionList);
      }

      // 通知父组件更新当前会话（如果重命名的是当前会话）
      if (
        typeof onSelectSession === "function" &&
        currentSession &&
        currentSession.id === editingSession.id
      ) {
        const updatedSession = sessionList.find(
          (s) => s.id === currentSession.id
        );
        if (updatedSession) {
          onSelectSession(updatedSession);
        }
      }

      message.success(t("chat.renameChat") + t("common.success"));
      setIsModalVisible(false);
      setEditingSession(null);
    } catch (error) {
      console.error("重命名会话失败:", error);
      message.error(t("chat.renameChat") + t("common.failed"));
    }
  };

  // 渲染会话项的更多操作菜单
  const getSessionMenu = (session) => (
    <Menu>
      <Menu.Item
        key="rename"
        icon={<EditOutlined />}
        onClick={() => showRenameModal(session)}
      >
        {t("chat.renameChat")}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={() => confirmDelete(session.id, session.name)}
        danger
      >
        {t("chat.deleteChat")}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="session-list-container">
      <div className="session-list-header">
        <h3>{t("chat.newChat")}</h3>
      </div>

      <div className="session-search">
        <Input
          placeholder={t("common.search") + "..."}
          prefix={<SearchOutlined className="search-icon" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="session-list">
        {filteredSessions.length === 0 ? (
          <div className="empty-session-list">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("chat.noMessages")}
            />
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                currentSession && currentSession.id === session.id
                  ? "active"
                  : ""
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className="session-item-content">
                <div className="session-icon">
                  <MessageOutlined />
                </div>
                <div className="session-details">
                  <h4 className="session-name">{session.name}</h4>
                  <p className="session-time">
                    {new Date(session.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Dropdown
                  overlay={getSessionMenu(session)}
                  trigger={["click"]}
                  placement="bottomRight"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    className="session-action-button"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 重命名会话模态框 */}
      <Modal
        title={t("chat.renameChat")}
        open={isModalVisible}
        onOk={handleRenameSession}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingSession(null);
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Input
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder={t("chat.enterChatName")}
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default SessionList;
