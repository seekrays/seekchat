<template>
  <div>
    <!-- 页面头部 -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">MCP 服务器</h2>
        <button
          @click="showAdd = true"
          class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          新增服务器
        </button>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-blue-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <p class="text-blue-800 font-medium">
              MCP (Model Context Protocol) 服务器配置
            </p>
            <p class="text-blue-600 text-sm mt-1">
              配置和管理 MCP 服务器，为AI模型提供外部工具和数据访问能力
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务器列表 -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>

    <div
      v-else-if="servers.length === 0"
      class="bg-white rounded-lg shadow-sm p-12 text-center"
    >
      <div class="text-gray-400 mb-4">
        <svg
          class="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          ></path>
        </svg>
      </div>
      <p class="text-gray-500 text-lg">暂无 MCP 服务器</p>
      <p class="text-gray-400 mt-2">点击上方按钮新增你的第一个 MCP 服务器</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="server in servers"
        :key="server.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div
              class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4"
            >
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ server.name }}
              </h3>
              <div class="flex items-center mt-1">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="
                    server.type === 'stdio'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  "
                >
                  {{ server.type.toUpperCase() }}
                </span>
                <span
                  class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
                  :class="
                    server.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  "
                >
                  {{ server.active ? "已启用" : "已禁用" }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="testConnection(server)"
              class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="测试连接"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
            <button
              @click="editServer(server)"
              class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="编辑"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
            </button>
            <button
              @click="deleteServer(server)"
              class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="删除"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
            <div class="ml-4 flex items-center">
              <input
                type="checkbox"
                :checked="server.active"
                @change="toggleActive(server)"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600">启用</span>
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600"
        >
          <div>
            <span class="font-medium">类型:</span>
            <span class="ml-2">{{
              server.type === "stdio" ? "标准输入输出" : "Server-Sent Events"
            }}</span>
          </div>
          <div>
            <span class="font-medium">URL/命令:</span>
            <span
              class="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded"
              >{{ server.url }}</span
            >
          </div>
          <div class="md:col-span-2">
            <span class="font-medium">描述:</span>
            <span class="ml-2">{{ server.description || "无描述" }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div
      v-if="showAdd"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900">
              {{ editing ? "编辑" : "新增" }} MCP 服务器
            </h3>
            <button
              @click="closeModal"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <form @submit.prevent="saveServer" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >名称 *</label
            >
            <input
              v-model="form.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="例如：本地搜索工具"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >类型 *</label
            >
            <select
              v-model="form.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="stdio">stdio - 标准输入输出</option>
              <option value="sse">sse - Server-Sent Events</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ form.type === "stdio" ? "命令" : "URL" }} *
            </label>
            <textarea
              v-model="form.url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              required
              :placeholder="
                form.type === 'stdio'
                  ? 'npx mcp-search'
                  : 'http://localhost:3000/mcp'
              "
            />
            <p class="text-xs text-gray-500 mt-1">
              {{
                form.type === "stdio"
                  ? "要执行的命令行程序"
                  : "MCP 服务器的 URL 地址"
              }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >描述</label
            >
            <textarea
              v-model="form.description"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              placeholder="服务器描述（可选）"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              @click="testConnection()"
              :disabled="testingConnection"
              class="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50"
            >
              {{ testingConnection ? "测试中..." : "测试连接" }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              保存
            </button>
          </div>
        </form>

        <!-- 测试结果 -->
        <div v-if="testResult" class="px-6 pb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center mb-2">
              <svg
                v-if="testResult.success"
                class="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span
                class="font-medium"
                :class="testResult.success ? 'text-green-800' : 'text-red-800'"
              >
                {{ testResult.success ? "连接成功" : "连接失败" }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ testResult.message }}</p>

            <div
              v-if="
                testResult.success &&
                testResult.tools &&
                testResult.tools.length > 0
              "
            >
              <h4 class="text-sm font-medium text-gray-700 mb-2">可用工具：</h4>
              <div class="space-y-1">
                <div
                  v-for="tool in testResult.tools"
                  :key="tool.name"
                  class="flex items-center text-sm"
                >
                  <svg
                    class="w-4 h-4 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span class="font-medium">{{ tool.name }}</span>
                  <span class="text-gray-500 ml-2">{{ tool.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { databaseService, type McpServer } from "../../services/database";
import { notification } from "../../services/notification";

const servers = ref<McpServer[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const editing = ref(false);
const testingConnection = ref(false);
const testResult = ref<{
  success: boolean;
  message?: string;
  tools?: any[];
} | null>(null);
const form = ref({
  id: null as number | null,
  name: "",
  type: "stdio",
  url: "",
  description: "",
  active: true,
});

function toast(message: string, type: "success" | "error" | "info" = "info") {
  if (type === "success") {
    notification.success(message);
  } else if (type === "error") {
    notification.error(message);
  } else {
    notification.info(message);
  }
}

async function loadServers() {
  try {
    loading.value = true;
    servers.value = await databaseService.getAllMcpServers();
  } catch (error) {
    console.error("加载MCP服务器失败:", error);
    toast("加载服务器列表失败", "error");
  } finally {
    loading.value = false;
  }
}

function editServer(server: McpServer) {
  editing.value = true;
  showAdd.value = true;
  form.value = {
    id: server.id || null,
    name: server.name,
    type: server.type,
    url: server.url,
    description: server.description || "",
    active: server.active,
  };
}

async function deleteServer(server: McpServer) {
  if (!server.id) return;

  const confirmed = await notification.confirm({
    type: "danger",
    title: "删除服务器",
    message: `确定要删除服务器 ${server.name} 吗？此操作不可撤销。`,
    confirmText: "删除",
    cancelText: "取消",
  });

  if (confirmed) {
    try {
      await databaseService.deleteMcpServer(server.id);
      toast("删除服务器成功", "success");
      await loadServers();
    } catch (error) {
      console.error("删除服务器失败:", error);
      toast("删除服务器失败", "error");
    }
  }
}

async function toggleActive(server: McpServer) {
  if (!server.id) return;

  try {
    // 如果要启用服务器，先测试连接
    if (!server.active) {
      await testConnection(server, { silent: true });
    }

    await databaseService.updateMcpServer({
      ...server,
      active: !server.active,
    });

    toast(server.active ? "服务器已禁用" : "服务器已启用");
    await loadServers();
  } catch (error) {
    console.error("切换服务器状态失败:", error);
    toast("切换服务器状态失败");
  }
}

async function testConnection(
  server?: McpServer,
  options: { silent?: boolean } = {}
) {
  try {
    if (!options.silent) {
      testingConnection.value = true;
      testResult.value = null;
    }

    // 获取测试数据
    const testData = server || {
      name: form.value.name,
      type: form.value.type,
      url: form.value.url,
      description: form.value.description,
    };

    // 模拟连接测试
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟成功结果
    const result = {
      success: true,
      message: "连接成功",
      tools: [
        { name: "search", description: "搜索工具" },
        { name: "file", description: "文件操作工具" },
      ],
    };

    if (!options.silent) {
      testResult.value = result;
    }

    return result;
  } catch (error) {
    console.error("测试连接失败:", error);
    const result = { success: false, message: "连接失败" };

    if (!options.silent) {
      testResult.value = result;
    }

    return result;
  } finally {
    if (!options.silent) {
      testingConnection.value = false;
    }
  }
}

function closeModal() {
  showAdd.value = false;
  editing.value = false;
  testResult.value = null;
  form.value = {
    id: null,
    name: "",
    type: "stdio",
    url: "",
    description: "",
    active: true,
  };
}

async function saveServer() {
  try {
    if (editing.value && form.value.id) {
      // 编辑模式
      await databaseService.updateMcpServer({
        id: form.value.id,
        name: form.value.name,
        type: form.value.type,
        url: form.value.url,
        description: form.value.description || "",
        active: form.value.active,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      toast("更新服务器成功");
    } else {
      // 新增模式
      await databaseService.createMcpServer({
        name: form.value.name,
        type: form.value.type,
        url: form.value.url,
        description: form.value.description || "",
        active: form.value.active,
      });
      toast("新增服务器成功");
    }

    closeModal();
    await loadServers();
  } catch (error) {
    console.error("保存服务器失败:", error);
    toast("保存服务器失败");
  }
}

onMounted(() => {
  loadServers();
});
</script>
