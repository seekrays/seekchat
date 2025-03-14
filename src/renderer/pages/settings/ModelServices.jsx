import React from "react";
import { Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

const ModelServices = ({
  providers,
  handleSelectProvider,
  handleProviderEnabledChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="provider-list-container">
      <Title level={4}>{t("settings.selectProvider")}</Title>
      <Paragraph>{t("settings.selectProviderHint")}</Paragraph>

      <div className="provider-grid">
        {providers && providers.length > 0 ? (
          providers.map((provider) => (
            <div
              key={provider.id}
              className={`provider-grid-item ${
                !provider.enabled ? "provider-disabled" : ""
              }`}
            >
              <div
                className="provider-content"
                onClick={() => handleSelectProvider(provider)}
              >
                <div className="provider-logo-container">
                  <img
                    src={provider.logo || "assets/providers/openai.png"}
                    alt={provider.name}
                    className="provider-logo"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.querySelector(
                        ".anticon"
                      ).style.display = "block";
                    }}
                  />
                </div>
                <div className="provider-info">
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-model-count">
                    {provider.models.length} {t("common.models")}
                  </div>
                </div>
              </div>
              <div
                className="provider-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={provider.enabled !== false}
                  onChange={(checked) =>
                    handleProviderEnabledChange(provider.id, checked)
                  }
                  checkedChildren={t("common.enable")}
                  unCheckedChildren={t("common.disable")}
                />
              </div>
            </div>
          ))
        ) : (
          <div>{t("settings.noProvidersAvailable")}</div>
        )}
      </div>
    </div>
  );
};

export default ModelServices;
