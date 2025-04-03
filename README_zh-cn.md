# SeekChat


<div align="center">
  <img src="public/assets/logo/logo.png" alt="SeekChat Logo" width="200" />
  <h3>✨ 一个简洁强大的AI桌面助手 ✨</h3>
  <p>
    <a href="https://www.seekrays.com/chat" target="_blank">官网</a> |
    <a href="README.md">English Document</a>
  </p>
</div>

[![Discord](https://img.shields.io/badge/Discord-加入讨论-blue?logo=discord&logoColor=white)](https://discord.gg/qbaNshaq)


SeekChat 支持 MCP 工具调用，让 AI 直接操作您的电脑并执行各种任务。轻松实现文件管理、数据分析、代码开发等自动化操作，将 AI 变成真正的智能助手。

## 🌠 截图

### 聊天界面
![聊天界面](docs/screenshot/screenshot-chat.png)

### MCP 工具设置
![MCP 工具设置](docs/screenshot/screenshot-setting-mcp.png)

## ✨ 主要特性

- **多 AI 提供商支持**：支持多种 AI 服务提供商
- **MCP 工具集成**：支持 [Model Context Protocol](https://github.com/mccpros/model-context-protocol) 工具，增强 AI 能力
- **本地存储**：聊天历史记录存储在本地，保护您的隐私
- **多语言支持**：支持英文和中文
- **现代化界面**：简单直观的用户界面


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

# 构建生产版本
# 对于 macOS
npm run electron:build:mac

# 对于 Windows
npm run electron:build:win

# 对于 Linux
npm run electron:build:linux
```

## 🔌 支持的 AI 提供商

- OpenAI
- Anthropic (Claude)
- Google (Gemini)
- 自定义提供商

## 🤝 贡献

欢迎提交 Pull Requests 或 Issues！如果您有任何建议或发现了 bug，请告诉我们。

## 🙏 鸣谢

- 感谢所有开源项目的贡献者
- 感谢 Electron 和 React 社区
- 特别感谢所有用户的支持和反馈


