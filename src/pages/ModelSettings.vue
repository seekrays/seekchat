<script setup lang="ts">
import { ref, onMounted } from "vue";

const models = ref<any[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const newModel = ref({ name: "", provider: "", type: "", enabled: true });

async function loadModels() {
  loading.value = true;
  const db = await load("sqlite");
  models.value = await db.select(
    "SELECT * FROM models ORDER BY updated_at DESC"
  );
  loading.value = false;
}

async function addModel() {
  const db = await load("sqlite");
  const now = Date.now();
  await db.execute(
    "INSERT INTO models (name, provider, type, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [
      newModel.value.name,
      newModel.value.provider,
      newModel.value.type,
      newModel.value.enabled ? 1 : 0,
      now,
      now,
    ]
  );
  showAdd.value = false;
  newModel.value = { name: "", provider: "", type: "", enabled: true };
  loadModels();
}

onMounted(loadModels);
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">模型管理</h2>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        @click="showAdd = true"
      >
        新增模型
      </button>
    </div>
    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="m in models"
        :key="m.id"
        class="bg-white rounded shadow p-4 flex flex-col"
      >
        <div class="font-bold text-lg mb-2">{{ m.name }}</div>
        <div class="text-gray-500 mb-1">Provider: {{ m.provider }}</div>
        <div class="text-gray-500 mb-1">类型: {{ m.type }}</div>
        <div class="flex-1"></div>
        <div class="mt-2 flex items-center">
          <span :class="m.enabled ? 'text-green-600' : 'text-gray-400'">
            {{ m.enabled ? "启用" : "禁用" }}
          </span>
        </div>
      </div>
    </div>
    <!-- 新增模型弹窗 -->
    <div
      v-if="showAdd"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">新增模型</h3>
        <form @submit.prevent="addModel">
          <div class="mb-2">
            <label class="block mb-1">名称</label>
            <input
              v-model="newModel.name"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2">
            <label class="block mb-1">Provider</label>
            <input
              v-model="newModel.provider"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2">
            <label class="block mb-1">类型</label>
            <input
              v-model="newModel.type"
              class="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div class="mb-2 flex items-center">
            <label class="mr-2">启用</label>
            <input type="checkbox" v-model="newModel.enabled" />
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
