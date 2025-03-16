const { app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
const path = require("path");
const ChatDatabase = require("./database");
const { registerIpcHandlers } = require("./ipc");
const logger = require("./logger");
const { cleanup } = require("./services/mcpService");

const isDev = process.env.NODE_ENV === "development";

let db;
let mainWindow;

// 捕获全局未处理异常
logger.catchErrors();

// 确保数据库已初始化
function ensureDatabase() {
  if (!db) {
    logger.info("初始化数据库...");
    try {
      db = new ChatDatabase();
      logger.info("数据库初始化成功");
    } catch (err) {
      logger.error("数据库初始化失败:", err);
      if (mainWindow) {
        mainWindow.webContents.send(
          "db-error",
          "数据库初始化失败: " + err.message
        );
      }
    }
  }
  return db;
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },

    icon: isDev
      ? path.join(__dirname, "../../public/assets/logo/logo.png")
      : path.join(__dirname, "../../dist/assets/logo/logo.png"),
  });

  Menu.setApplicationMenu(null);

  // 监听页面开始加载事件（刷新或导航）
  mainWindow.webContents.on("did-start-loading", () => {
    logger.info("页面开始加载，检查是否有pending状态的消息");
    const database = ensureDatabase();
    if (database) {
      database
        .updateAllPendingMessagesToError()
        .then((result) => {
          if (result.updatedCount > 0) {
            logger.info(`页面刷新时处理了 ${result.updatedCount} 条中断的消息`);
          }
        })
        .catch((err) => {
          logger.error("更新中断消息状态失败:", err);
        });
    }
  });

  // 加载应用
  if (isDev) {
    // 开发环境下，加载Vite开发服务器
    mainWindow.loadURL("http://localhost:5173");
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境下，加载打包后的index.html
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  logger.info("应用启动...");
  createWindow();

  // 处理打开外部链接的请求
  ipcMain.handle("open-external-url", async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      logger.error("打开外部链接失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 确保数据库已初始化
  const database = ensureDatabase();

  // 更新所有pending状态的消息为error状态
  if (database) {
    database
      .updateAllPendingMessagesToError()
      .then((result) => {
        logger.info(`应用启动时处理了 ${result.updatedCount} 条中断的消息`);
      })
      .catch((err) => {
        logger.error("更新中断消息状态失败:", err);
      });
  }

  // 注册所有IPC处理程序
  registerIpcHandlers(database)
    .then(() => {
      logger.info("IPC处理程序注册成功");
    })
    .catch((error) => {
      logger.error("注册IPC处理程序失败:", error);
    });

  app.on("activate", function () {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// 应用退出前关闭数据库连接
app.on("will-quit", () => {
  if (db) {
    logger.info("应用退出，关闭数据库连接");
    db.close();
  }
  cleanup();
});
