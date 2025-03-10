# SeekChat

<div align="center">
  <img src="public/assets/logo/logo.png" alt="SeekChat Logo" width="200" />
  <h3>✨ 一个简洁强大的AI聊天桌面应用 ✨</h3>
</div>

## 简介

SeekChat 是一款支持多种 LLM（大型语言模型）的桌面聊天应用程序，采用 Electron + React 技术栈开发，旨在为用户提供无缝的 AI 对话体验。无论是个人助手、创意伙伴还是专业工具，SeekChat 都能满足您的需求。

## ✨ 主要特性

- **多模型支持**：连接多个 AI 服务提供商，包括 OpenAI、DeepSeek、硅基流动 等
- **本地记忆**：所有对话历史都保存在本地 SQLite 数据库中，保护您的隐私
- **流式响应**：实时显示 AI 回复，提供类似 ChatGPT 的对话体验
- **Markdown 支持**：完整支持 Markdown 格式，包括代码块、表格和数学公式
- **界面精美**：现代化界面设计，支持明/暗主题切换
- **灵活配置**：可自定义 API 密钥、接口参数和模型设置
- **多平台支持**：兼容 macOS、Windows 和 Linux 系统

## 🛠️ 技术栈

- **框架**：Electron + React
- **UI 组件**：Ant Design
- **数据库**：SQLite
- **构建工具**：Vite
- **路由**：React Router

## 📦 安装

### 下载预编译版本

访问 [Releases](https://github.com/seekrays/seekchat/releases) 页面下载最新的预编译版本。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/seekrays/seekchat.git
cd seekchat

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建应用
npm run electron:build
```

## 🚀 开始使用

1. 启动应用后，首先进入设置页面配置 API 密钥
2. 选择您要使用的 AI 模型服务提供商
3. 开始新的对话！

## 🤝 贡献

欢迎提交 Pull Requests 或 Issues！如果您有任何建议或发现了 bug，请告诉我们。

## 🙏 鸣谢

- 感谢所有开源项目的贡献者
- 感谢 Electron 和 React 社区
- 特别感谢所有用户的支持和反馈

---

<div align="center">
  <p>使用 ❤️ 构建</p>
</div>
