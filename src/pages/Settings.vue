<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <button @click="goBack" class="text-gray-600 hover:text-gray-900">
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 class="text-xl font-bold">设置</h1>
          <div class="w-6"></div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <div class="bg-white rounded-lg shadow">
        <!-- MCP服务器配置 -->
        <div class="p-6 border-b">
          <h2 class="text-lg font-semibold mb-4">MCP服务器</h2>
          <div class="space-y-4">
            <div v-for="server in mcpServers" :key="server.id" class="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <div class="font-medium">{{ server.name }}</div>
                <div class="text-sm text-gray-500">{{ server.url }}</div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="toggleServer(server)"
                  :class="[
                    'px-3 py-1 rounded text-sm',
                    server.active
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700',
                  ]"
                >
                  {{ server.active ? '已启用' : '已禁用' }}
                </button>
                <button
                  @click="deleteServer(server.id)"
                  class="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            </div>

            <button
              @click="showAddServerModal = true"
              class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              添加服务器
            </button>
          </div>
        </div>

        <!-- 模型配置 -->
        <div class="p-6">
          <h2 class="text-lg font-semibold mb-4">AI模型</h2>
          <div class="space-y-4">
            <div v-for="model in models" :key="model.id" class="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <div class="font-medium">{{ model.name }}</div>
                <div class="text-sm text-gray-500">{{ model.provider }}</div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="toggleModel(model)"
                  :class="[
                    'px-3 py-1 rounded text-sm',
                    model.enabled
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700',
                  ]"
                >
                  {{ model.enabled ? '已启用' : '已禁用' }}
                </button>
                <button
                  @click="deleteModel(model.id)"
                  class="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            </div>

            <button
              @click="showAddModelModal = true"
              class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              添加模型
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加服务器弹窗 -->
    <div v-if="showAddServerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">添加MCP服务器</h3>
        <form @submit.prevent="addServer" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">名称</label>
            <input
              v-model="newServer.name"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">URL</label>
            <input
              v-model="newServer.url"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">类型</label>
            <input
              v-model="newServer.server_type"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="showAddServerModal = false"
              class="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加模型弹窗 -->
    <div v-if="showAddModelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">添加AI模型</h3>
        <form @submit.prevent="addModel" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">名称</label>
            <input
              v-model="newModel.name"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">提供商</label>
            <input
              v-model="newModel.provider"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">类型</label>
            <input
              v-model="newModel.model_type"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="showAddModelModal = false"
              class="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { databaseService, type McpServer, type Model } from '../services/database';
import { aiService } from '../services/ai';

const router = useRouter();
const mcpServers = ref<McpServer[]>([]);
const models = ref<Model[]>([]);
const showAddServerModal = ref(false);
const showAddModelModal = ref(false);

const newServer = ref({
  name: '',
  url: '',
  server_type: '',
});

const newModel = ref({
  name: '',
  provider: '',
  model_type: '',
});

function goBack() {
  router.back();
}

async function loadServers() {
  try {
    mcpServers.value = await databaseService.getActiveMcpServers();
  } catch (error) {
    console.error('加载MCP服务器失败:', error);
  }
}

async function loadModels() {
  try {
    models.value = await databaseService.getModels();
  } catch (error) {
    console.error('加载模型列表失败:', error);
  }
}

async function addServer() {
  try {
    // TODO: 实现添加服务器的逻辑
    showAddServerModal.value = false;
    await loadServers();
  } catch (error) {
    console.error('添加服务器失败:', error);
  }
}

async function addModel() {
  try {
    // TODO: 实现添加模型的逻辑
    showAddModelModal.value = false;
    await loadModels();
  } catch (error) {
    console.error('添加模型失败:', error);
  }
}

async function toggleServer(server: McpServer) {
  try {
    // TODO: 实现切换服务器状态的逻辑
    await loadServers();
  } catch (error) {
    console.error('切换服务器状态失败:', error);
  }
}

async function toggleModel(model: Model) {
  try {
    // TODO: 实现切换模型状态的逻辑
    await loadModels();
  } catch (error) {
    console.error('切换模型状态失败:', error);
  }
}

async function deleteServer(id?: number) {
  if (!id) return;
  try {
    // TODO: 实现删除服务器的逻辑
    await loadServers();
  } catch (error) {
    console.error('删除服务器失败:', error);
  }
}

async function deleteModel(id?: number) {
  if (!id) return;
  try {
    // TODO: 实现删除模型的逻辑
    await loadModels();
  } catch (error) {
    console.error('删除模型失败:', error);
  }
}

onMounted(async () => {
  await loadServers();
  await loadModels();
});
</script>
