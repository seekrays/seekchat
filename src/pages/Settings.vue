<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white border-b flex-shrink-0 shadow-sm">
      <div class="px-6 py-4 flex items-center justify-between">
        <button 
          @click="goBack" 
          class="text-gray-600 hover:text-gray-900 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
        >
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
        <h1 class="text-xl font-bold text-gray-900">设置</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="flex-1 flex overflow-hidden">
      <div class="bg-white shadow flex flex-1 min-h-0">
        <!-- 左侧菜单 -->
        <aside
          class="w-64 border-r flex flex-col py-6 px-3 bg-gray-50 overflow-y-auto"
        >
          <nav class="space-y-6">
            <!-- 模型服务 -->
            <div>
              <div class="text-xs text-gray-400 px-3 mb-2 uppercase tracking-wide font-semibold">
                模型服务
              </div>
              <button
                class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mb-1 group"
                :class="{
                  'bg-blue-600 text-white font-semibold shadow-sm': selectedMenu === 'modelServices',
                  'text-gray-700 hover:bg-blue-50 hover:text-blue-600': selectedMenu !== 'modelServices'
                }"
                @click="selectedMenu = 'modelServices'"
              >
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  模型服务
                </div>
              </button>
            </div>
            
            <!-- MCP设置 -->
            <div>
              <div class="text-xs text-gray-400 px-3 mb-2 uppercase tracking-wide font-semibold">
                MCP 设置
              </div>
              <button
                class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mb-1 group"
                :class="{
                  'bg-blue-600 text-white font-semibold shadow-sm': selectedMenu === 'mcpSettings',
                  'text-gray-700 hover:bg-blue-50 hover:text-blue-600': selectedMenu !== 'mcpSettings'
                }"
                @click="selectedMenu = 'mcpSettings'"
              >
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  MCP 服务器
                </div>
              </button>
            </div>
            
            <!-- 通用设置 -->
            <div>
              <div class="text-xs text-gray-400 px-3 mb-2 uppercase tracking-wide font-semibold">
                通用设置
              </div>
              <button
                class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mb-1 group"
                :class="{
                  'bg-blue-600 text-white font-semibold shadow-sm': selectedMenu === 'general',
                  'text-gray-700 hover:bg-blue-50 hover:text-blue-600': selectedMenu !== 'general'
                }"
                @click="selectedMenu = 'general'"
              >
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  通用设置
                </div>
              </button>
            </div>
            
            <!-- 关于 -->
            <div>
              <div class="text-xs text-gray-400 px-3 mb-2 uppercase tracking-wide font-semibold">
                关于
              </div>
              <button
                class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mb-1 group"
                :class="{
                  'bg-blue-600 text-white font-semibold shadow-sm': selectedMenu === 'about',
                  'text-gray-700 hover:bg-blue-50 hover:text-blue-600': selectedMenu !== 'about'
                }"
                @click="selectedMenu = 'about'"
              >
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  关于
                </div>
              </button>
            </div>
          </nav>
        </aside>
        
        <!-- 右侧内容区 -->
        <section class="flex-1 bg-gray-50 overflow-y-auto min-w-0">
          <div class="max-w-6xl mx-auto p-6">
            <ModelServices v-if="selectedMenu === 'modelServices'" />
            <MCPSettings v-else-if="selectedMenu === 'mcpSettings'" />
            <GeneralSettings v-else-if="selectedMenu === 'general'" />
            <AboutSection v-else-if="selectedMenu === 'about'" />
          </div>
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
