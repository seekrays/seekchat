<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">MCP 配置</h2>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        @click="showAdd = true"
      >
        新增 MCP Server
      </button>
    </div>
    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else class="space-y-4">
      <div
        v-for="s in servers"
        :key="s.id"
        class="bg-white rounded shadow p-4 flex flex-col"
      >
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold text-lg">{{ s.name }}</div>
          <div class="flex items-center space-x-2">
            <button
              class="text-blue-600 hover:underline"
              @click="editServer(s)"
            >
              编辑
            </button>
            <button
              class="text-red-500 hover:underline"
              @click="deleteServer(s.id)"
            >
              删除
            </button>
            <button class="ml-2" @click="toggleActive(s)">
              <span v-if="s.active">🟢 启用</span>
              <span v-else>⚪ 禁用</span>
            </button>
          </div>
        </div>
        <div class="text-gray-500 mb-1">类型: {{ s.type }}</div>
        <div class="text-gray-500 mb-1">URL/命令: {{ s.url }}</div>
        <div class="text-gray-500">描述: {{ s.description }}</div>
      </div>
    </div>
    <!-- 新增/编辑弹窗 -->
    <div
      v-if="showAdd || editing"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">
          {{ editing ? "编辑" : "新增" }} MCP Server
        </h3>
        <form @submit.prevent="saveServer">
          <div class="mb-2">
            <label class="block mb-1">名称</label>
            <input
              v-model="form.name"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2">
            <label class="block mb-1">类型</label>
            <select v-model="form.type" class="border rounded px-2 py-1 w-full">
              <option value="stdio">stdio</option>
              <option value="sse">sse</option>
            </select>
          </div>
          <div class="mb-2">
            <label class="block mb-1">URL/命令</label>
            <input
              v-model="form.url"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2">
            <label class="block mb-1">描述</label>
            <input
              v-model="form.description"
              class="border rounded px-2 py-1 w-full"
            />
          </div>
          <div class="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              class="px-4 py-2 rounded bg-gray-200"
              @click="closeModal"
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
const servers = ref<any[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const editing = ref(false);
const form = ref({
  id: null,
  name: "",
  type: "stdio",
  url: "",
  description: "",
  active: true,
});

function editServer(s: any) {
  editing.value = true;
  Object.assign(form.value, s);
}
function deleteServer(id: number) {
  servers.value = servers.value.filter((s) => s.id !== id);
}
function toggleActive(s: any) {
  s.active = !s.active;
}
function closeModal() {
  showAdd.value = false;
  editing.value = false;
  form.value = {
    id: null,
    name: "",
    type: "stdio",
    url: "",
    description: "",
    active: true,
  };
}
function saveServer() {
  if (editing.value) {
    // 编辑
    const idx = servers.value.findIndex((s) => s.id === form.value.id);
    if (idx !== -1) servers.value[idx] = { ...form.value };
  } else {
    // 新增
    servers.value.push({ ...form.value, id: Date.now() });
  }
  closeModal();
}

onMounted(() => {
  loading.value = true;
  // TODO: 替换为实际数据库/API 调用
  servers.value = [
    {
      id: 1,
      name: "本地MCP",
      type: "stdio",
      url: "npx mcp-search",
      description: "本地命令",
      active: true,
    },
    {
      id: 2,
      name: "远程MCP",
      type: "sse",
      url: "http://localhost:3000/mcp",
      description: "远程服务",
      active: false,
    },
  ];
  loading.value = false;
});
</script>
