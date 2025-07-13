<template>
  <div class="max-w-xl mx-auto">
    <div class="bg-white rounded shadow p-6 mb-6">
      <h2 class="text-lg font-bold mb-4">通用设置</h2>
      <div class="mb-4">
        <label class="block mb-1">语言</label>
        <select v-model="language" class="border rounded px-2 py-1 w-full">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
    <div class="bg-white rounded shadow p-6">
      <h3 class="text-base font-bold mb-2">重置配置</h3>
      <p class="mb-4 text-gray-500">清除所有本地配置，恢复默认设置。</p>
      <button
        class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        @click="resetConfig"
      >
        重置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const language = ref("zh-CN");
function resetConfig() {
  // TODO: 实现重置逻辑
  alert("重置配置功能待实现");
}
</script>
