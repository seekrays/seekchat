# SeekChat

<div align="center">
  <img src="public/assets/logo/logo.png" alt="SeekChat Logo" width="200" />
  <h3>✨ A Sleek and Powerful AI Chat Desktop Application ✨</h3>
  <p>
    <a href="https://www.seekrays.com/chat/" target="_blank">Official Website</a> |
    <a href="README_zh-cn.md">中文文档</a>
  </p>
</div>

## Introduction

SeekChat is a desktop chat application that supports multiple Large Language Models (LLMs), built with Electron + React. It aims to provide users with a seamless AI conversation experience. Whether you need a personal assistant, creative partner, or professional tool, SeekChat can meet your requirements.

## ✨ Key Features

- **Multi-Model Support**: Connect to multiple AI service providers, including OpenAI, DeepSeek, Silicon Valley AI, and more
- **MCP Tools Integration**: Access and utilize Machine Comprehension and Processing tools for enhanced functionality
- **Custom Providers**: Add your own API providers with flexible configuration options
- **Local Memory**: All conversation history is stored in a local SQLite database, protecting your privacy
- **Streaming Responses**: Real-time display of AI replies, providing a ChatGPT-like conversation experience
- **Markdown Support**: Full support for Markdown formatting, including code blocks, tables, and math formulas
- **Beautiful Interface**: Modern interface design with light/dark theme switching
- **Flexible Configuration**: Customize API keys, interface parameters, and model settings
- **Multi-Platform Support**: Compatible with macOS, Windows, and Linux systems

## 🛠️ Technology Stack

- **Framework**: Electron + React
- **UI Components**: Ant Design
- **Database**: SQLite
- **Build Tool**: Vite
- **Routing**: React Router

## 📦 Installation

### Download Pre-compiled Version

Visit the [Releases](https://github.com/seekrays/seekchat/releases) page to download the latest pre-compiled version.

### Build from Source

```bash
# Clone repository
git clone https://github.com/seekrays/seekchat.git
cd seekchat

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build application
npm run electron:build
```

## 🚀 Getting Started

1. After launching the application, first go to the settings page to configure your API keys
2. Select the AI model service provider you want to use
3. Start a new conversation!

## 🔌 Supported AI Providers

SeekChat supports the following AI service providers:

- **OpenAI** (GPT-4o, GPT-4.5-preview, o1-mini, etc.)
- **DeepSeek** (DeepSeek Chat, DeepSeek Reasoner)
- **Silicon Valley AI** (DeepSeek-V3, DeepSeek-R1, Qwen2.5, Llama-3.3, etc.)
- **Custom Providers**: Configure your own API endpoints and parameters
- **More coming soon!**

## 🤝 Contributing

Pull Requests and Issues are welcome! If you have any suggestions or find a bug, please let us know.

## 🙏 Acknowledgements

- Thanks to all open-source project contributors
- Thanks to the Electron and React communities
- Special thanks to all users for their support and feedback

---

<div align="center">
  <p>Built with ❤️</p>
</div>
