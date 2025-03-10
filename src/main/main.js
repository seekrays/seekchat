const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";
const ChatDatabase = require("./database");

let db;
let mainWindow;

// 确保数据库已初始化
function ensureDatabase() {
  if (!db) {
    console.log("初始化数据库...");
    try {
      db = new ChatDatabase();
      console.log("数据库初始化成功");
    } catch (err) {
      console.error("数据库初始化失败:", err);
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

  // 监听页面开始加载事件（刷新或导航）
  mainWindow.webContents.on("did-start-loading", () => {
    console.log("页面开始加载，检查是否有pending状态的消息");
    const database = ensureDatabase();
    if (database) {
      database
        .updateAllPendingMessagesToError()
        .then((result) => {
          if (result.updatedCount > 0) {
            console.log(`页面刷新时处理了 ${result.updatedCount} 条中断的消息`);
          }
        })
        .catch((err) => {
          console.error("更新中断消息状态失败:", err);
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
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  // 确保数据库已初始化
  ensureDatabase();

  // 更新所有pending状态的消息为error状态
  const database = ensureDatabase();
  if (database) {
    database
      .updateAllPendingMessagesToError()
      .then((result) => {
        console.log(`应用启动时处理了 ${result.updatedCount} 条中断的消息`);
      })
      .catch((err) => {
        console.error("更新中断消息状态失败:", err);
      });
  }

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
    console.log("应用退出，关闭数据库连接");
    db.close();
  }
});

// 包装 IPC 处理器，确保数据库已初始化
function wrapDbHandler(handler) {
  return async (event, ...args) => {
    try {
      const database = ensureDatabase();
      if (!database) {
        throw new Error("数据库未初始化");
      }
      return await handler(database, ...args);
    } catch (err) {
      console.error("IPC 处理器错误:", err);
      throw err;
    }
  };
}

// IPC通信处理
// 获取所有会话
ipcMain.handle(
  "get-sessions",
  wrapDbHandler(async (database) => {
    console.log("main进程: 获取所有会话");
    return await database.getAllSessions();
  })
);

// 创建新会话
ipcMain.handle(
  "create-session",
  wrapDbHandler(async (database, name) => {
    console.log("main进程: 创建会话", name);
    return await database.createSession(name);
  })
);

// 获取会话消息
ipcMain.handle(
  "get-messages",
  wrapDbHandler(async (database, sessionId) => {
    console.log("main进程: 获取会话消息", sessionId);
    return await database.getMessages(sessionId);
  })
);

// 删除会话消息
ipcMain.handle(
  "delete-messages",
  wrapDbHandler(async (database, sessionId) => {
    console.log("main进程: 删除会话消息", sessionId);
    return await database.deleteMessages(sessionId);
  })
);

// 添加消息
ipcMain.handle(
  "add-message",
  wrapDbHandler(async (database, message) => {
    console.log("main进程: 即将添加消息");
    const result = await database.addMessage(message);
    console.log("main进程: 添加消息成功, ID:", result.id);
    return result;
  })
);

// 更新消息状态
ipcMain.handle(
  "update-message-status",
  wrapDbHandler(async (database, id, status) => {
    console.log("main进程: 即将更新消息状态, ID:", id);
    const result = await database.updateMessageStatus(id, status);
    console.log("main进程: 更新消息状态成功");
    return result;
  })
);

// 更新消息内容
ipcMain.handle(
  "update-message-content",
  wrapDbHandler(async (database, id, content) => {
    console.log("main进程: 即将更新消息内容, ID:", id);
    const result = await database.updateMessageContent(id, content);
    console.log("main进程: 更新消息内容成功");
    return result;
  })
);

// 删除会话
ipcMain.handle(
  "delete-session",
  wrapDbHandler(async (database, id) => {
    console.log("main进程: 即将删除会话", id);
    const result = await database.deleteSession(id);
    console.log("main进程: 删除会话成功");
    return result;
  })
);

// 创建或更新消息
ipcMain.handle(
  "create-or-update-message",
  wrapDbHandler(async (database, message) => {
    console.log(
      "main进程: 即将创建或更新消息",
      message.id ? `ID: ${message.id}` : "新消息"
    );
    const result = await database.createOrUpdateMessage(message);
    console.log("main进程: 创建或更新消息成功, ID:", result.id);
    return result;
  })
);

// 更新会话元数据
ipcMain.handle(
  "update-session-metadata",
  wrapDbHandler(async (database, sessionId, metadata) => {
    console.log("main进程: 即将更新会话元数据, ID:", sessionId);
    const result = await database.updateSessionMetadata(sessionId, metadata);
    console.log("main进程: 更新会话元数据成功");
    return result;
  })
);

// 更新会话名称
ipcMain.handle(
  "update-session-name",
  wrapDbHandler(async (database, sessionId, name) => {
    console.log("main进程: 即将更新会话名称, ID:", sessionId);
    const result = await database.updateSessionName(sessionId, name);
    console.log("main进程: 更新会话名称成功");
    return result;
  })
);
