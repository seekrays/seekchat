<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-blue-600 text-3xl">🤖</span>
            <h1 class="text-2xl font-bold">SeekChat</h1>
          </div>
          <nav class="flex items-center space-x-4">
            <router-link
              to="/settings"
              class="text-gray-600 hover:text-gray-900"
            >
              设置
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto text-center space-y-8">
        <h2 class="text-3xl font-bold text-gray-900">
          欢迎使用 SeekChat
        </h2>
        <p class="text-lg text-gray-600">
          一个强大的AI聊天客户端，支持多种模型和自定义配置。
        </p>
        <div class="flex justify-center space-x-4">
          <router-link
            to="/chat"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            开始聊天
          </router-link>
          <router-link
            to="/settings"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            配置设置
          </router-link>
        </div>
      </div>

      <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-2xl mb-4">🎯</div>
          <h3 class="text-lg font-semibold mb-2">多模型支持</h3>
          <p class="text-gray-600">
            支持多种AI模型，可以根据需求自由切换不同的模型。
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-2xl mb-4">⚡</div>
          <h3 class="text-lg font-semibold mb-2">MCP协议</h3>
          <p class="text-gray-600">
            支持Model Context Protocol，实现更灵活的模型调用。
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-2xl mb-4">🔒</div>
          <h3 class="text-lg font-semibold mb-2">数据安全</h3>
          <p class="text-gray-600">
            本地数据存储，确保您的聊天记录和配置信息安全。
          </p>
        </div>
      </div>
    </main>

    <footer class="mt-16 bg-white border-t">
      <div class="container mx-auto px-4 py-8">
        <div class="text-center text-gray-500">
          <p>SeekChat - 开源AI聊天客户端</p>
          <p class="mt-2">
            <a
              href="https://github.com/seekrays/seekchat"
              target="_blank"
              class="text-blue-600 hover:text-blue-800"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { databaseService } from '../services/database';
import { aiService } from '../services/ai';

onMounted(async () => {
  // 初始化数据库和AI服务
  try {
    await databaseService.init();
    await aiService.init();
  } catch (error) {
    console.error('初始化失败:', error);
  }
});
</script>
