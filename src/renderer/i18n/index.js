import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 导入语言文件
import enTranslation from "./locales/en/translation.json";
import zhCNTranslation from "./locales/zh-CN/translation.json";

// 配置i18next
i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 将i18n实例传递给react-i18next
  .use(initReactI18next)
  // 初始化i18next
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      "zh-CN": {
        translation: zhCNTranslation,
      },
    },
    fallbackLng: "en", // 默认语言
    debug: false, // 生产环境关闭调试

    interpolation: {
      escapeValue: false, // 不转义HTML
    },

    // 检测语言的选项
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "language", // 存储在localStorage中的键名
      caches: ["localStorage"],
    },
  });

export default i18n;
