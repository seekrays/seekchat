import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/lib/locale/zh_CN";
import enUS from "antd/lib/locale/en_US";
import App from "./App.jsx";
import "./index.css";
import "./i18n"; // 导入i18n配置
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "./i18n";

// 创建一个包装组件来处理语言切换
const AppWrapper = () => {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = useState(
    i18n.language === "zh-CN" ? zhCN : enUS
  );

  // 监听语言变化，更新Ant Design的语言配置
  useEffect(() => {
    const handleLanguageChange = () => {
      setAntdLocale(i18n.language === "zh-CN" ? zhCN : enUS);
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  return (
    <ConfigProvider locale={antdLocale}>
      <App />
    </ConfigProvider>
  );
};

// 创建React根节点
const root = ReactDOM.createRoot(document.getElementById("root"));

// 渲染应用
root.render(
  <I18nextProvider i18n={i18n}>
    <AppWrapper />
  </I18nextProvider>
);
