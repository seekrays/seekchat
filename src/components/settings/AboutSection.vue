<template>
  <div>
    <!-- 应用信息 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mb-6">
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">SeekChat</h2>
        <div class="flex items-center justify-center mb-3">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            版本 {{ version }}
          </span>
          <span class="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {{ buildInfo }}
          </span>
        </div>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto">
          一个现代化的多模型聊天客户端，支持本地与远程模型，MCP Server 管理等功能。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 功能特性 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          主要功能
        </h3>
        <ul class="space-y-3">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700">多模型支持 - 接入各种 AI 模型</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700">MCP 协议支持 - 扩展工具生态</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700">本地数据存储 - 保护隐私安全</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700">现代化界面 - 简洁美观易用</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700">跨平台支持 - 多终端同步</span>
          </li>
        </ul>
      </div>

      <!-- 技术栈 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
          技术栈
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <span class="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">Vue 3</div>
              <div class="text-xs text-gray-500">前端框架</div>
            </div>
          </div>
          <div class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">TypeScript</div>
              <div class="text-xs text-gray-500">类型系统</div>
            </div>
          </div>
          <div class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center mr-3">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">Tailwind</div>
              <div class="text-xs text-gray-500">样式框架</div>
            </div>
          </div>
          <div class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">Tauri</div>
              <div class="text-xs text-gray-500">桌面应用</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 链接导航 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          相关链接
        </h3>
        <div class="grid grid-cols-1 gap-3">
          <a
            href="https://seekrays.com/chat"
            target="_blank"
            class="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
          >
            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-600 transition-colors">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900">官方网站</div>
              <div class="text-sm text-gray-500">了解更多产品信息</div>
            </div>
          </a>
          <a
            href="https://seekrays.com/chat/docs/"
            target="_blank"
            class="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
          >
            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-600 transition-colors">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900">使用文档</div>
              <div class="text-sm text-gray-500">查看详细使用指南</div>
            </div>
          </a>
          <a
            href="https://github.com/seekrays/seekchat"
            target="_blank"
            class="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
          >
            <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-4 group-hover:bg-gray-900 transition-colors">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900">GitHub</div>
              <div class="text-sm text-gray-500">查看源代码和贡献</div>
            </div>
          </a>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg class="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          系统信息
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">用户代理</span>
            <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{{ userAgent }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">屏幕分辨率</span>
            <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{{ screenResolution }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">语言</span>
            <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{{ language }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">时区</span>
            <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{{ timezone }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="bg-white rounded-lg shadow-sm p-6 mt-6 text-center">
      <div class="flex items-center justify-center mb-4">
        <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
        </svg>
        <span class="text-gray-600">Made with love by</span>
      </div>
      <div class="text-gray-500 text-sm">
        <p class="mb-2">&copy; 2024 Seekrays. All rights reserved.</p>
        <p class="text-xs">
          感谢所有贡献者和开源社区的支持
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

// 应用信息
const version = ref("2.0.0");
const buildInfo = ref("Beta");

// 系统信息
const userAgent = computed(() => {
  return navigator.userAgent.includes("Chrome") ? "Chrome" : 
         navigator.userAgent.includes("Firefox") ? "Firefox" : 
         navigator.userAgent.includes("Safari") ? "Safari" : "Unknown";
});

const screenResolution = computed(() => {
  return `${window.screen.width}x${window.screen.height}`;
});

const language = computed(() => {
  return navigator.language || "zh-CN";
});

const timezone = computed(() => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
});

onMounted(() => {
  // 可以在这里获取更多系统信息或应用信息
  console.log("AboutSection mounted");
});
</script>
