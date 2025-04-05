import React, { useState, useEffect } from "react";
import {
  Card,
  Space,
  Divider,
  Typography,
  Button,
  Row,
  Col,
  Avatar,
} from "antd";
import { useTranslation } from "react-i18next";
import {
  GithubOutlined,
  BookOutlined,
  CommentOutlined,
  GlobalOutlined,
  RobotOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const AboutSection = () => {
  const { t, i18n } = useTranslation();
  const [version, setVersion] = useState("");

  // 在组件加载时获取版本号
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const appVersion = await window.electronAPI.getAppVersion();
        setVersion(appVersion);
      } catch (error) {
        console.error("获取应用版本号失败:", error);
        setVersion("unknown");
      }
    };
    fetchVersion();
  }, []);

  // 打开外部链接的函数
  const openExternalLink = (url) => {
    window.electronAPI.openExternalURL(url).catch((err) => {
      console.error(t("about.openLinkFailed"), err);
    });
  };

  return (
    <div className="about-section settings-content">
      <Card
        bordered={false}
        style={{
          borderRadius: "12px",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 顶部Logo和标题 */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar
              size={80}
              icon={<RobotOutlined />}
              style={{
                backgroundColor: "#1890ff",
                marginBottom: 16,
              }}
            />
            <Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>
              SeekChat
            </Title>
            <Text type="secondary" style={{ fontSize: "16px" }}>
              {t("about.version")}: {version}
            </Text>
            <Paragraph
              style={{
                marginTop: 16,
                color: "#666",
                maxWidth: "450px",
                margin: "0 auto",
              }}
            >
              {t("about.description")}
            </Paragraph>
          </div>

          <Divider style={{ margin: "24px 0" }} />

          {/* 链接卡片区域 */}
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: "center",
                  borderRadius: "8px",
                  height: "100%",
                }}
                onClick={() => openExternalLink("https://seekrays.com/chat")}
              >
                <div style={{ padding: "8px 0" }}>
                  <GlobalOutlined
                    style={{
                      fontSize: "28px",
                      color: "#1890ff",
                      marginBottom: "12px",
                    }}
                  />
                  <p style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>
                    {t("about.officialWebsite")}
                  </p>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: "center",
                  borderRadius: "8px",
                  height: "100%",
                }}
                onClick={() =>
                  openExternalLink("https://seekrays.com/chat/docs/")
                }
              >
                <div style={{ padding: "8px 0" }}>
                  <BookOutlined
                    style={{
                      fontSize: "28px",
                      color: "#52c41a",
                      marginBottom: "12px",
                    }}
                  />
                  <p style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>
                    {t("about.documentation")}
                  </p>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: "center",
                  borderRadius: "8px",
                  height: "100%",
                }}
                onClick={() => openExternalLink("https://seekrays.com/chat")}
              >
                <div style={{ padding: "8px 0" }}>
                  <CommentOutlined
                    style={{
                      fontSize: "28px",
                      color: "#fa8c16",
                      marginBottom: "12px",
                    }}
                  />
                  <p style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>
                    {t("about.feedback")}
                  </p>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: "center",
                  borderRadius: "8px",
                  height: "100%",
                }}
                onClick={() =>
                  openExternalLink("https://github.com/seekrays/seekchat")
                }
              >
                <div style={{ padding: "8px 0" }}>
                  <GithubOutlined
                    style={{
                      fontSize: "28px",
                      color: "#333",
                      marginBottom: "12px",
                    }}
                  />
                  <p style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>
                    {t("about.github", "GitHub")}
                  </p>
                </div>
              </Card>
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          {/* 版权信息 */}
          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              © {new Date().getFullYear()} SeekRays.{" "}
              {t("about.allRightsReserved")}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AboutSection;
