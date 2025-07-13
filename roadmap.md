# SeekChat Tauri+Vue3+TS+Tailwind 重构 Roadmap
tauri2 plugin:https://v2.tauri.app/plugin/

## 目标
- 使用 Tauri + Vue3 + TypeScript + TailwindCSS 重构 SeekChat 桌面端
- 数据库沿用原有 sqlite 文件，所有功能与原项目保持一致
- 旧代码全部移至 old/ 目录，仅供参考

---

## 1. 项目初始化与基础配置
- [x] 使用 tauri 官方脚手架创建新项目，选择 vue3 + typescript
- [x] 配置 tailwindcss（vite + tailwind）
- [x] 保留原有 src-tauri/ 目录和数据库文件，确保 tauri 后端直接复用
- [x] 配置 tauri.conf.json，确保数据库路径与原项目一致

---

## 2. 数据库与后端（Rust/Tauri/前端直连）
- [x] 复用原有 sqlite 数据库文件
- [x] MCP Server、模型、会话、消息等表结构与原有保持一致（已自动建表）
- [x] 支持前端通过 tauri sqlite 插件或其它方式直接操作数据库
- [x] 仅安全/系统能力相关接口放在 tauri 后端，其余可前端直接实现

---

## 3. 前端页面与组件（Vue3 + TS + Tailwind）
### 3.1 页面结构
- [x] src/pages/ModelSettings.vue：模型管理与配置页面
- [x] src/pages/Home.vue：主界面页面（含导航与 router-view）
- [ ] src/pages/Settings.vue：设置主页面
- [ ] src/pages/MCPSettings.vue：MCP Server 配置页面（表单+JSON Tab）
- [ ] src/pages/Chat.vue：聊天主页面（含对话框、历史、工具调用等）

### 3.2 组件
- [ ] src/components/MCPServerList.vue：MCP Server 列表展示与操作
- [ ] src/components/MCPServerForm.vue：MCP Server 表单
- [ ] src/components/MCPServerJsonImport.vue：MCP Server JSON 导入
- [ ] src/components/ModelList.vue：模型列表与管理
- [ ] src/components/ChatWindow.vue：对话窗口
- [ ] src/components/MessageItem.vue：单条消息
- [ ] 其它可复用组件（如弹窗、按钮等）

### 3.3 状态管理
- [ ] 使用 Pinia 管理 MCP Server、模型、会话、消息等

### 3.4 样式
- [ ] 全部使用 tailwindcss 原子类
- [ ] 兼容暗色模式

---

## 4. 前后端通信与本地能力
- [x] 前端通过 @tauri-apps/api/tauri 的 invoke 方法调用 tauri command
- [x] 支持前端直接操作 sqlite 数据库、文件、命令行等本地能力
- [x] MCP Server、模型、会话、消息等操作可前端直连 DB 或调用后端

---

## 5. 迁移与兼容
- [x] 保证所有数据结构与原有一致（如 MCP Server、模型、会话、消息等字段）
- [x] 兼容原有数据库 schema，无需迁移数据
- [x] 旧代码全部移至 old/ 目录，仅供参考

---

## 6. 计划分步实施
### 第一步：项目初始化与基础配置
- [x] 完成 tauri+vue3+ts+tailwind 项目搭建，配置好 tailwind
- [x] 确认数据库文件可被 tauri 后端和前端访问

### 第二步：MCP Server、模型、会话、消息等表结构与接口实现
- [x] MCP Server、模型、会话、消息等增删改查、激活、测试等接口
- [x] 支持前端直连 DB 或调用 tauri 后端

### 第三步：前端各页面与组件开发
- [x] 模型管理与配置页面
- [x] 主界面页面（含导航与 router-view）
- [ ] MCP Server 配置页面（表单+JSON Tab）
- [ ] 聊天主页面（含对话框、历史、工具调用等）
- [ ] 其它设置页面

### 第四步：功能完善与兼容性测试
- [ ] 兼容原有所有功能
- [ ] UI/UX 优化，tailwindcss 统一风格

---

## 7. 重点注意
- 数据库文件路径务必与原项目一致，防止数据丢失
- 接口兼容性：字段、表结构、业务逻辑与原有保持一致
- UI/UX：tailwindcss 统一风格，兼容暗色模式
- 代码结构：前后端分离，组件化、类型安全
- 前端可直接操作 MCP、DB，提升开发效率

---

> 后续所有重构操作均以本 Roadmap 为准，逐步推进。 