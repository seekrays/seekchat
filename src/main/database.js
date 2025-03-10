const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { app } = require("electron");

class ChatDatabase {
  constructor() {
    // 数据库文件路径，放在应用数据目录中
    const dbPath = path.join(app.getPath("userData"), "seekchat.db");

    console.log("数据库文件路径:", dbPath);

    try {
      // 创建数据库连接
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error("数据库连接失败:", err.message);
        } else {
          console.log("已连接到数据库");
          this.init();
        }
      });
    } catch (err) {
      console.error("创建数据库连接失败:", err.message);
      throw err;
    }
  }

  // 初始化数据库表
  init() {
    // 检查数据库对象是否存在
    if (!this.db) {
      console.error("初始化失败：数据库对象不存在");
      throw new Error("数据库对象不存在");
    }

    // 保存 this 引用，以便在回调中使用
    const self = this;

    // 启用外键约束
    this.db.run("PRAGMA foreign_keys = ON");

    // 创建会话表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        metadata TEXT DEFAULT '',
        updatedAt INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT 0
      )
    `);

    // 创建消息表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId INTEGER NOT NULL,
        role TEXT NOT NULL,
        providerId INTEGER NOT NULL,
        modelId INTEGER NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT '',
        updatedAt INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT 0,
        FOREIGN KEY (sessionId) REFERENCES chat_session(id) ON DELETE CASCADE
      )
    `);

    console.log("数据库表初始化完成");

    // 检查是否有会话，如果没有则创建一个默认会话
    this.db.get("SELECT COUNT(*) as count FROM chat_session", (err, row) => {
      if (err) {
        console.error("检查会话数量失败:", err);
        return;
      }

      if (row.count === 0) {
        console.log("创建默认会话");
        self.createSession("新对话");
      }
    });
  }

  // 获取所有会话
  getAllSessions() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM chat_session ORDER BY updatedAt DESC",
        (err, rows) => {
          if (err) {
            console.error("获取会话列表失败:", err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // 创建新会话
  createSession(name) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      this.db.run(
        "INSERT INTO chat_session (name, updatedAt, createdAt) VALUES (?, ?, ?)",
        [name, now, now],
        function (err) {
          if (err) {
            console.error("创建会话失败:", err);
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              name,
              updatedAt: now,
              createdAt: now,
            });
          }
        }
      );
    });
  }

  // 获取会话的所有消息
  getMessages(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM chat_message WHERE sessionId = ? ORDER BY createdAt ASC",
        [sessionId],
        (err, rows) => {
          if (err) {
            console.error("获取会话消息失败:", err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // 删除会话的所有消息
  deleteMessages(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "DELETE FROM chat_message WHERE sessionId = ?",
        [sessionId],
        function (err) {
          if (err) {
            console.error("删除会话消息失败:", err);
            reject(err);
          } else {
            resolve({ success: true, sessionId, deleted: this.changes });
          }
        }
      );
    });
  }

  // 添加新消息
  addMessage(message) {
    return new Promise((resolve, reject) => {
      if (!message || !message.sessionId) {
        reject(new Error("消息必须包含 sessionId"));
        return;
      }

      const {
        sessionId,
        role,
        providerId,
        modelId,
        content,
        status = "",
      } = message;
      const now = Date.now();

      console.log("数据库: 准备添加消息", {
        sessionId,
        role,
        content:
          typeof content === "string"
            ? content.substring(0, 30) + "..."
            : "[对象]",
      });

      // 保存 this 引用，以便在回调中使用
      const self = this;

      this.db.run(
        "INSERT INTO chat_message (sessionId, role, providerId, modelId, content, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [sessionId, role, providerId, modelId, content, status, now, now],
        function (err) {
          if (err) {
            console.error("添加消息失败:", err);
            reject(err);
          } else {
            console.log(`数据库: 消息添加成功, ID: ${this.lastID}`);

            // 更新会话的更新时间
            self.db.run(
              "UPDATE chat_session SET updatedAt = ? WHERE id = ?",
              [now, sessionId],
              (updateErr) => {
                if (updateErr) {
                  console.warn("更新会话时间失败:", updateErr);
                }
              }
            );

            resolve({
              id: this.lastID,
              sessionId,
              role,
              providerId,
              modelId,
              content,
              status,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      );
    });
  }

  // 更新消息状态
  updateMessageStatus(id, status) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      this.db.run(
        "UPDATE chat_message SET status = ?, updatedAt = ? WHERE id = ?",
        [status, now, id],
        function (err) {
          if (err) {
            console.error("更新消息状态失败:", err);
            reject(err);
          } else {
            if (this.changes === 0) {
              console.warn(`数据库: 未找到要更新状态的消息 ID: ${id}`);
            } else {
              console.log(
                `数据库: 消息状态更新成功, ID: ${id}, 状态: ${status}`
              );
            }

            resolve({ id, status, updatedAt: now, changed: this.changes > 0 });
          }
        }
      );
    });
  }

  // 更新消息内容
  updateMessageContent(id, content) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      this.db.run(
        "UPDATE chat_message SET content = ?, updatedAt = ? WHERE id = ?",
        [content, now, id],
        function (err) {
          if (err) {
            console.error("更新消息内容失败:", err);
            reject(err);
          } else {
            if (this.changes === 0) {
              console.warn(`数据库: 未找到要更新内容的消息 ID: ${id}`);
            } else {
              console.log(`数据库: 消息内容更新成功, ID: ${id}`);
            }

            resolve({ id, content, updatedAt: now, changed: this.changes > 0 });
          }
        }
      );
    });
  }

  // 删除会话
  deleteSession(id) {
    return new Promise((resolve, reject) => {
      // 保存 this 引用，以便在回调中使用
      const self = this;

      // 先删除会话的所有消息
      this.db.run(
        "DELETE FROM chat_message WHERE sessionId = ?",
        [id],
        (err) => {
          if (err) {
            console.error("删除会话消息失败:", err);
            reject(err);
            return;
          }

          // 再删除会话
          self.db.run(
            "DELETE FROM chat_session WHERE id = ?",
            [id],
            function (err) {
              if (err) {
                console.error("删除会话失败:", err);
                reject(err);
              } else {
                resolve({ success: true, id, deleted: this.changes > 0 });
              }
            }
          );
        }
      );
    });
  }

  // 创建或更新消息
  createOrUpdateMessage(message) {
    return new Promise((resolve, reject) => {
      if (!message || !message.sessionId) {
        reject(new Error("消息必须包含 sessionId"));
        return;
      }

      const {
        id,
        sessionId,
        role,
        providerId,
        modelId,
        content,
        status = "",
      } = message;
      const now = Date.now();

      // 保存 this 引用，以便在回调中使用
      const self = this;

      // 如果有ID，先检查消息是否存在
      if (id) {
        this.db.get(
          "SELECT id FROM chat_message WHERE id = ?",
          [id],
          (err, row) => {
            if (err) {
              console.error("查询消息失败:", err);
              reject(err);
              return;
            }

            if (row) {
              // 消息存在，更新它
              self.db.run(
                "UPDATE chat_message SET content = ?, status = ?, updatedAt = ? WHERE id = ?",
                [content, status, now, id],
                function (err) {
                  if (err) {
                    console.error("更新消息失败:", err);
                    reject(err);
                  } else {
                    console.log(`消息更新成功, ID: ${id}`);

                    // 更新会话的更新时间
                    self.db.run(
                      "UPDATE chat_session SET updatedAt = ? WHERE id = ?",
                      [now, sessionId]
                    );

                    resolve({
                      id,
                      sessionId,
                      role,
                      providerId,
                      modelId,
                      content,
                      status,
                      updatedAt: now,
                    });
                  }
                }
              );
            } else {
              // 消息不存在，创建新消息
              self.db.run(
                "INSERT INTO chat_message (sessionId, role, providerId, modelId, content, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  sessionId,
                  role,
                  providerId,
                  modelId,
                  content,
                  status,
                  now,
                  now,
                ],
                function (err) {
                  if (err) {
                    console.error("添加消息失败:", err);
                    reject(err);
                  } else {
                    console.log(`消息创建成功, ID: ${this.lastID}`);

                    // 更新会话的更新时间
                    self.db.run(
                      "UPDATE chat_session SET updatedAt = ? WHERE id = ?",
                      [now, sessionId]
                    );

                    resolve({
                      id: this.lastID,
                      sessionId,
                      role,
                      providerId,
                      modelId,
                      content,
                      status,
                      createdAt: now,
                      updatedAt: now,
                    });
                  }
                }
              );
            }
          }
        );
      } else {
        // 没有ID，直接创建新消息
        this.db.run(
          "INSERT INTO chat_message (sessionId, role, providerId, modelId, content, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [sessionId, role, providerId, modelId, content, status, now, now],
          function (err) {
            if (err) {
              console.error("添加消息失败:", err);
              reject(err);
            } else {
              console.log(`消息创建成功, ID: ${this.lastID}`);

              // 更新会话的更新时间
              self.db.run(
                "UPDATE chat_session SET updatedAt = ? WHERE id = ?",
                [now, sessionId]
              );

              resolve({
                id: this.lastID,
                sessionId,
                role,
                providerId,
                modelId,
                content,
                status,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        );
      }
    });
  }

  // 更新会话元数据
  updateSessionMetadata(sessionId, metadata) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      // 将metadata转换为字符串
      const metadataStr =
        typeof metadata === "string" ? metadata : JSON.stringify(metadata);

      this.db.run(
        "UPDATE chat_session SET metadata = ?, updatedAt = ? WHERE id = ?",
        [metadataStr, now, sessionId],
        function (err) {
          if (err) {
            console.error("更新会话元数据失败:", err);
            reject(err);
          } else {
            if (this.changes === 0) {
              console.warn(`数据库: 未找到要更新元数据的会话 ID: ${sessionId}`);
              reject(new Error(`未找到会话 ID: ${sessionId}`));
            } else {
              console.log(`数据库: 会话元数据更新成功, ID: ${sessionId}`);
              resolve({
                id: sessionId,
                metadata: metadataStr,
                updatedAt: now,
                changed: this.changes > 0,
              });
            }
          }
        }
      );
    });
  }

  // 更新会话名称
  updateSessionName(sessionId, name) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      this.db.run(
        "UPDATE chat_session SET name = ?, updatedAt = ? WHERE id = ?",
        [name, now, sessionId],
        function (err) {
          if (err) {
            console.error("更新会话名称失败:", err);
            reject(err);
          } else {
            if (this.changes === 0) {
              console.warn(`数据库: 未找到要更新名称的会话 ID: ${sessionId}`);
              reject(new Error(`未找到会话 ID: ${sessionId}`));
            } else {
              console.log(`数据库: 会话名称更新成功, ID: ${sessionId}`);
              resolve({
                id: sessionId,
                name,
                updatedAt: now,
                changed: this.changes > 0,
              });
            }
          }
        }
      );
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("关闭数据库连接失败:", err);
            reject(err);
          } else {
            console.log("数据库连接已关闭");
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // 更新所有处于pending状态的消息为error状态
  updateAllPendingMessagesToError() {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const errorContent = JSON.stringify([
        { type: "content", text: "页面刷新导致请求中断", status: "error" },
      ]);

      this.db.all(
        "SELECT id, content FROM chat_message WHERE status = ?",
        ["pending"],
        (err, rows) => {
          if (err) {
            console.error("查询pending消息失败:", err);
            reject(err);
            return;
          }

          console.log(
            `找到 ${rows.length} 条处于pending状态的消息，将它们更新为error状态`
          );

          if (rows.length === 0) {
            resolve({ updatedCount: 0 });
            return;
          }

          const self = this;
          let updatedCount = 0;

          // 使用事务进行批量更新
          this.db.run("BEGIN TRANSACTION", function (err) {
            if (err) {
              console.error("开始事务失败:", err);
              reject(err);
              return;
            }

            // 更新每条消息的状态和内容
            rows.forEach((row) => {
              let content = row.content;

              // 尝试处理JSON格式的内容
              try {
                const parsedContent = JSON.parse(content);
                // 如果是简单的字符串内容，转换为错误格式
                if (
                  typeof parsedContent === "string" ||
                  !Array.isArray(parsedContent)
                ) {
                  content = errorContent;
                }
              } catch (e) {
                // 如果内容不是JSON格式，使用错误内容
                content = errorContent;
              }

              self.db.run(
                "UPDATE chat_message SET status = ?, content = ?, updatedAt = ? WHERE id = ?",
                ["error", content, now, row.id],
                function (updateErr) {
                  if (updateErr) {
                    console.error(`更新消息 ${row.id} 失败:`, updateErr);
                    self.db.run("ROLLBACK");
                    reject(updateErr);
                    return;
                  }

                  updatedCount += this.changes;

                  // 如果所有消息都已更新，提交事务
                  if (updatedCount === rows.length) {
                    self.db.run("COMMIT", (commitErr) => {
                      if (commitErr) {
                        console.error("提交事务失败:", commitErr);
                        reject(commitErr);
                        return;
                      }

                      console.log(
                        `成功将 ${updatedCount} 条pending消息更新为error状态`
                      );
                      resolve({ updatedCount });
                    });
                  }
                }
              );
            });
          });
        }
      );
    });
  }
}

module.exports = ChatDatabase;
