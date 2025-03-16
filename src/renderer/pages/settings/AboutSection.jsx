import React from "react";
import { Card, Space, Divider, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const AboutSection = () => {
  const { t, i18n } = useTranslation();

  // 根据当前语言选择不同的URL
  const currentLanguage = i18n.language || "en";
  const aboutUrl =
    currentLanguage === "zh-CN"
      ? "http://chat.seekrays.com/about_zh-CN/?version=0.0.1"
      : "http://chat.seekrays.com/about/?version=0.0.1";

  return (
    <div className="about-section settings-content">
      <Card>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>
              SeekChat
            </Title>
            <Text type="secondary">{t("about.version")}: 0.0.1</Text>
            <div style={{ marginTop: 8 }}>
              <Text>
                {t("about.officialWebsite")}：{" "}
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    window.electronAPI
                      .openExternalURL("http://chat.seekrays.com")
                      .catch((err) => {
                        console.error("打开链接失败:", err);
                      });
                  }}
                  style={{ cursor: "pointer", color: "#1890ff" }}
                >
                  http://chat.seekrays.com
                </div>
              </Text>
            </div>
          </div>

          <Divider />

          {/* 嵌入外部关于页面 */}
          <div
            style={{ width: "100%", overflow: "hidden", borderRadius: "8px" }}
          >
            <iframe
              src={aboutUrl}
              title="About SeekChat"
              style={{
                width: "100%",
                height: "580px",
                border: "none",
                overflow: "auto",
                maxWidth: "100%",
              }}
              allowFullScreen={true}
              loading="lazy"
            />
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AboutSection;
