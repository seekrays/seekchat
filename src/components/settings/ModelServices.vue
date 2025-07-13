<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">模型服务</h2>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        @click="showAdd = true"
      >
        新增服务
      </button>
    </div>
    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="p in providers"
        :key="p.id"
        class="bg-white rounded shadow p-4 flex flex-col"
      >
        <div class="font-bold text-lg mb-2">{{ p.name }}</div>
        <div class="text-gray-500 mb-1">Base URL: {{ p.baseUrl }}</div>
        <div class="flex-1"></div>
        <div class="mt-2 flex items-center space-x-2">
          <span :class="p.enabled ? 'text-green-600' : 'text-gray-400'">{{
            p.enabled ? "已启用" : "已禁用"
          }}</span>
          <button
            class="ml-auto text-blue-600 hover:underline"
            @click="selectProvider(p)"
          >
            配置
          </button>
        </div>
      </div>
    </div>
    <!-- 新增服务弹窗 -->
    <div
      v-if="showAdd"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">新增模型服务</h3>
        <form @submit.prevent="addProvider">
          <div class="mb-2">
            <label class="block mb-1">名称</label>
            <input
              v-model="newProvider.name"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2">
            <label class="block mb-1">Base URL</label>
            <input
              v-model="newProvider.baseUrl"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2">
            <label class="block mb-1">API Key</label>
            <input
              v-model="newProvider.apiKey"
              class="border rounded px-2 py-1 w-full"
            />
          </div>
          <div class="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              class="px-4 py-2 rounded bg-gray-200"
              @click="showAdd = false"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded bg-blue-600 text-white"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
const providers = ref<any[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const newProvider = ref({ name: "", baseUrl: "", apiKey: "", enabled: true });

function selectProvider(p: any) {
  // TODO: 跳转到 ProviderSettings 或弹窗
  alert("配置功能待实现: " + p.name);
}

async function loadProviders() {
  loading.value = true;
  // TODO: 替换为实际数据库/API 调用
  providers.value = [
    { id: 1, name: "OpenAI", baseUrl: "https://api.openai.com", enabled: true },
    {
      id: 2,
      name: "自定义服务",
      baseUrl: "http://localhost:8000",
      enabled: false,
    },
  ];
  loading.value = false;
}

function addProvider() {
  // TODO: 实现新增逻辑
  const newId = Date.now();
  providers.value.push({ ...newProvider.value, id: newId });
  showAdd.value = false;
  newProvider.value = { name: "", baseUrl: "", apiKey: "", enabled: true };
}

onMounted(loadProviders);
</script>
