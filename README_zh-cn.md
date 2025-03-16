# SeekChat

<div align="center">
  <img src="public/assets/logo/logo.png" alt="SeekChat Logo" width="200" />
  <h3>✨ 一个简洁强大的AI聊天桌面应用 ✨</h3>
  <p>
    <a href="https://www.seekrays.com/chat/" target="_blank">官网</a> |
    <a href="README.md">英文文档</a>
  </p>
</div>

## 简介

SeekChat 支持 MCP 工具调用，让 AI 直接操作您的电脑并执行各种任务。轻松实现文件管理、数据分析、代码开发等自动化操作，将 AI 变成真正的智能助手。

## ✨ 主要特性

- **多模型支持**：连接多个 AI 服务提供商，包括 OpenAI、DeepSeek、硅基流动 等
- **MCP 工具集成**：访问和使用机器理解与处理工具，增强应用功能
- **自定义提供商**：添加自己的 API 提供商，支持灵活配置选项
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

## 🔌 支持的 AI 提供商

SeekChat 支持以下 AI 服务提供商：

- **OpenAI** (GPT-4o, GPT-4.5-preview, o1-mini 等)
- **DeepSeek** (DeepSeek Chat, DeepSeek Reasoner)
- **硅基流动** (DeepSeek-V3, DeepSeek-R1, Qwen2.5, Llama-3.3 等)
- **自定义提供商**：配置您自己的 API 端点和参数

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
