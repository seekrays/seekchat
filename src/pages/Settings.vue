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
      <div class="bg-white rounded-lg shadow flex min-h-[600px]">
        <!-- 左侧多级菜单 -->
        <aside class="w-64 border-r flex flex-col py-6 px-2 bg-gray-50">
          <nav class="space-y-4">
            <div>
              <div class="text-xs text-gray-400 px-2 mb-1">模型服务</div>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-blue-100 mb-1"
                :class="{
                  'bg-blue-600 text-white font-bold':
                    selectedMenu === 'modelServices',
                }"
                @click="selectedMenu = 'modelServices'"
              >
                模型服务
              </button>
            </div>
            <div>
              <div class="text-xs text-gray-400 px-2 mb-1">MCP 设置</div>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-blue-100 mb-1"
                :class="{
                  'bg-blue-600 text-white font-bold':
                    selectedMenu === 'mcpSettings',
                }"
                @click="selectedMenu = 'mcpSettings'"
              >
                MCP 设置
              </button>
            </div>
            <div>
              <div class="text-xs text-gray-400 px-2 mb-1">通用设置</div>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-blue-100 mb-1"
                :class="{
                  'bg-blue-600 text-white font-bold':
                    selectedMenu === 'general',
                }"
                @click="selectedMenu = 'general'"
              >
                通用设置
              </button>
            </div>
            <div>
              <div class="text-xs text-gray-400 px-2 mb-1">关于</div>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-blue-100 mb-1"
                :class="{
                  'bg-blue-600 text-white font-bold': selectedMenu === 'about',
                }"
                @click="selectedMenu = 'about'"
              >
                关于
              </button>
            </div>
          </nav>
        </aside>
        <!-- 右侧详情区 -->
        <section class="flex-1 p-8 bg-gray-50 overflow-y-auto">
          <ModelServices v-if="selectedMenu === 'modelServices'" />
          <MCPSettings v-else-if="selectedMenu === 'mcpSettings'" />
          <GeneralSettings v-else-if="selectedMenu === 'general'" />
          <AboutSection v-else-if="selectedMenu === 'about'" />
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ModelServices from "../components/settings/ModelServices.vue";
import MCPSettings from "../components/settings/MCPSettings.vue";
import GeneralSettings from "../components/settings/GeneralSettings.vue";
import AboutSection from "../components/settings/AboutSection.vue";

const router = useRouter();
const selectedMenu = ref("modelServices");
function goBack() {
  router.back();
}
</script>

<style scoped>
/* 可根据需要进一步美化 */
</style>
