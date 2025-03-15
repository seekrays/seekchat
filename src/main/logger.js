const electronLog = require("electron-log");
const path = require("path");
const { app } = require("electron");

// 配置日志文件
electronLog.transports.file.resolvePathFn = () => {
  // 获取用户数据路径
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "logs/main.log");
};

// 配置日志格式
electronLog.transports.file.format =
  "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";

// 设置日志文件大小限制为10MB
electronLog.transports.file.maxSize = 10 * 1024 * 1024;

// 设置保留最近5个日志文件
electronLog.transports.file.maxFiles = 5;

// 配置控制台输出
electronLog.transports.console.format = "[{level}] {text}";

// 设置日志级别
electronLog.transports.file.level = "info";
electronLog.transports.console.level = "debug";

// 创建一个包装器，同时输出到控制台和文件
const logger = {
  error: (...params) => {
    electronLog.error(...params);
  },
  warn: (...params) => {
    electronLog.warn(...params);
  },
  info: (...params) => {
    electronLog.info(...params);
  },
  verbose: (...params) => {
    electronLog.verbose(...params);
  },
  debug: (...params) => {
    electronLog.debug(...params);
  },
  silly: (...params) => {
    electronLog.silly(...params);
  },
  // 捕获未处理的异常和Promise拒绝
  catchErrors: () => {
    process.on("uncaughtException", (error) => {
      logger.error("未捕获的异常:", error);
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("未处理的Promise拒绝:", reason);
    });
  },
};

module.exports = logger;
