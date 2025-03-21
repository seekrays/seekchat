# SeekChat

<div align="center">
  <img src="public/assets/logo/logo.png" alt="SeekChat Logo" width="200" />
  <h3>✨ A Sleek and Powerful AI Desktop Assistant ✨</h3>
  <p>
    <a href="https://www.seekrays.com/chat" target="_blank">Official Website</a> |
    <a href="README_zh-cn.md">中文文档</a>
  </p>
</div>


SeekChat supports MCP tool execution, enabling AI to directly control your computer and perform various tasks. Easily automate file management, data analysis, code development, and more, turning AI into a truly intelligent assistant.


## ✨ Key Features

- **Multiple AI Providers**: Support for various AI service providers
- **MCP Tool Integration**: Support for [Model Context Protocol](https://github.com/mccpros/model-context-protocol) tools that enhance AI capabilities
- **Local Storage**: Chat history is stored locally to protect your privacy
- **Multi-language Support**: Available in English and Chinese
- **Modern UI**: Simple and intuitive user interface

## 🌠 Screenshots

### Chat Interface
![Chat Interface](docs/screenshot/screenshot-chat.png)

### MCP Tool Settings
![MCP Tool Settings](docs/screenshot/screenshot-setting-mcp.png)

## 📦 Installation

### Download Pre-compiled Version

Visit the [Releases](https://github.com/seekrays/seekchat/releases) page to download the latest pre-compiled version.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/seekrays/seekchat.git
cd seekchat

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
# For macOS
npm run electron:build:mac

# For Windows
npm run electron:build:win

# For Linux
npm run electron:build:linux
```

## 🔌 Supported AI Providers

- OpenAI
- Anthropic (Claude)
- Google (Gemini)
- Custom providers

## 🤝 Contributing

Pull Requests and Issues are welcome! If you have any suggestions or find a bug, please let us know.

## 🙏 Acknowledgements

- Thanks to all open-source project contributors
- Thanks to the Electron and React communities
- Special thanks to all users for their support and feedback

