# mcp 需求

## 功能

- 设置中有个 mcp 设置界面，可以添加 stdio 以及 sse 类型的 mcp server（这个信息存储在 db 中，可以新建一个表来进行处理）
- mcp 设置界面中可以进行 mcp 工具的测试状态、编辑以及开关状态
- 聊天界面中可以引入 mcp 工具的调用
  - 可以通过https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients包来进行获取mcp的工具
  - 如果是已开启的都传入
  - 通过 llm 的 function call 进行交互；比如 这个 llm 的 function call 的 api：https://docs.siliconflow.cn/cn/userguide/guides/function-calling
  - 这里可以需要根据不同的 llm 的 function call 来进行不同的处理，可能存在多轮对话调用
- 聊天界面中可以显示出工具的调用状态；另外调用的结果可以存储在 db 中

## 实施方案

### 一、整体架构设计

实现 MCP 功能需要以下核心模块：

1. **数据存储层**：存储 MCP 服务器配置和工具调用记录
2. **服务层**：MCP 服务器通信和工具处理
3. **UI 层**：设置界面和聊天界面集成

系统流程为：

1. 用户配置 MCP 服务器
2. 聊天时启用所需 MCP 工具
3. AI 使用 function calling 调用工具
4. 结果返回并显示在对话中

### 二、分步实施方案

#### 第一阶段：数据库设计和基础存储实现

1. **创建 MCP 服务器配置表**

```sql
CREATE TABLE mcp_servers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'stdio' 或 'sse'
  api_key TEXT,
  active BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

2. **创建 MCP 工具调用记录表**

```sql
CREATE TABLE mcp_tool_calls (
  id TEXT PRIMARY KEY NOT NULL,
  message_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  server_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  parameters TEXT,
  result TEXT,
  status TEXT NOT NULL, -- 'success', 'error', 'pending'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (server_id) REFERENCES mcp_servers (id)
);
```

3. **实现数据访问层**
   - 创建`MCPService`类管理 MCP 服务器数据
   - 实现 CRUD 方法和工具调用记录功能

#### 第二阶段：MCP 服务连接与工具管理

1. **安装 MCP SDK**

```bash
npm install @modelcontextprotocol/typescript-sdk
```

2. **创建 MCP 客户端管理器**

   - 实现客户端创建与缓存
   - 提供工具列表获取和执行方法
   - 支持不同类型（stdio/sse）的 MCP 服务器

3. **设置 IPC 处理**
   - 注册 MCP 相关的 IPC 处理程序
   - 实现服务器管理、连接测试和工具执行

#### 第三阶段：设置界面实现

1. **创建 MCP 设置组件**

   - 服务器列表展示
   - 添加/编辑/删除服务器功能
   - 服务器类型选择（stdio/sse）
   - 连接测试功能

2. **集成到设置页面**
   - 添加 MCP 设置导航
   - 更新设置路由

#### 第四阶段：聊天界面 MCP 工具集成

1. **创建工具栏组件**

   - 显示可用的 MCP 工具
   - 提供工具选择功能

2. **实现工具执行对话框**

   - 根据工具参数动态生成表单
   - 处理各种类型的参数（字符串、数字、布尔等）

3. **聊天输入集成**

   - 将工具栏添加到聊天输入区域
   - 记录启用的 MCP 服务器

4. **多轮对话支持**

   - 支持 AI 调用工具后继续对话
   - 处理工具调用结果展示

5. **不同 AI 提供商适配**
   - 为不同的 AI 提供商实现工具格式转换
   - 支持 OpenAI、Anthropic、Gemini 等格式

### 三、用户界面设计

1. **MCP 设置界面**

   - 服务器列表视图
   - 添加/编辑服务器的表单
   - 测试结果展示
   - 工具列表预览

2. **聊天界面工具集成**
   - 工具栏设计
   - 工具执行对话框
   - 工具调用和结果的展示样式

### 四、多轮对话实现方案

1. **sendMessageToAI 方法修改**

   - 支持工具调用
   - 处理多轮对话逻辑
   - 集成不同 AI 提供商的 function calling

2. **工具调用流程**

   - 工具调用标识和参数提取
   - 执行工具并返回结果
   - 结果整合到对话流中

3. **多轮状态管理**
   - 跟踪工具调用状态
   - 保持对话上下文
   - 处理连续的工具调用
