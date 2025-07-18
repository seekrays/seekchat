<template>
  <div>
    <!-- 页面头部 -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">通用设置</h2>
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <div>
            <p class="text-gray-800 font-medium">应用基本设置</p>
            <p class="text-gray-600 text-sm mt-1">配置语言、主题、数据管理等基本功能</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 语言和区域设置 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">语言和区域</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">界面语言</label>
            <select 
              v-model="language" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">时区</label>
            <select 
              v-model="timezone" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 主题设置 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">主题外观</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">主题模式</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="theme in themes"
                :key="theme.value"
                @click="selectedTheme = theme.value"
                :class="[
                  'p-3 rounded-lg border-2 transition-all duration-200',
                  selectedTheme === theme.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <div class="text-center">
                  <component :is="theme.icon" class="w-6 h-6 mx-auto mb-1" />
                  <span class="text-sm font-medium">{{ theme.label }}</span>
                </div>
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-gray-700">紧凑模式</label>
              <p class="text-xs text-gray-500">减少界面元素间距</p>
            </div>
            <input
              v-model="compactMode"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- 聊天设置 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">聊天设置</h3>
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-gray-700">自动保存会话</label>
              <p class="text-xs text-gray-500">自动保存聊天记录</p>
            </div>
            <input
              v-model="autoSave"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-gray-700">发送快捷键</label>
              <p class="text-xs text-gray-500">按 Enter 发送消息</p>
            </div>
            <input
              v-model="enterToSend"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">默认模型</label>
            <select 
              v-model="defaultModel" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择默认模型</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3">Claude 3</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">数据管理</h3>
        </div>
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-2">存储使用情况</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">聊天记录</span>
                <span class="font-medium">{{ storageUsage.chat }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">设置配置</span>
                <span class="font-medium">{{ storageUsage.settings }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">总计</span>
                <span class="font-medium">{{ storageUsage.total }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <button
              @click="exportData"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              导出数据
            </button>
            <button
              @click="importData"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              导入数据
            </button>
            <button
              @click="confirmResetConfig"
              class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              清除所有数据
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认重置弹窗 -->
    <div v-if="showResetConfirm" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6">
          <div class="flex items-center mb-4">
            <svg class="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 class="text-lg font-bold text-gray-900">确认重置</h3>
          </div>
          <p class="text-gray-600 mb-6">
            此操作将清除所有本地数据，包括聊天记录、设置配置、模型配置等。此操作不可逆转。
          </p>
          <div class="flex justify-end space-x-3">
            <button
              @click="showResetConfirm = false"
              class="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              取消
            </button>
            <button
              @click="resetConfig"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              确认重置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";

// 基本设置
const language = ref("zh-CN");
const timezone = ref("Asia/Shanghai");

// 主题设置
const selectedTheme = ref("system");
const compactMode = ref(false);

// 聊天设置
const autoSave = ref(true);
const enterToSend = ref(true);
const defaultModel = ref("");

// 数据管理
const showResetConfirm = ref(false);

// 主题选项
const themes = [
  {
    value: "light",
    label: "浅色",
    icon: () => h("svg", {
      class: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, [
      h("circle", { cx: "12", cy: "12", r: "5" }),
      h("path", { d: "m21 12-4.39-4.39M3 12l4.39-4.39M21 12l-4.39 4.39M3 12l4.39 4.39m8.95-8.95L12 12M3.05 8.05L12 12m8.95 8.95L12 12M3.05 15.95L12 12" })
    ])
  },
  {
    value: "dark",
    label: "深色",
    icon: () => h("svg", {
      class: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, [
      h("path", { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" })
    ])
  },
  {
    value: "system",
    label: "系统",
    icon: () => h("svg", {
      class: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, [
      h("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2", ry: "2" }),
      h("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
      h("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
    ])
  }
];

// 存储使用情况
const storageUsage = computed(() => {
  // 这里可以实现实际的存储计算逻辑
  return {
    chat: "2.5 MB",
    settings: "0.1 MB",
    total: "2.6 MB"
  };
});

function toast(message: string) {
  alert(message);
}

function confirmResetConfig() {
  showResetConfirm.value = true;
}

function resetConfig() {
  // TODO: 实现重置逻辑
  try {
    // 清除本地存储
    localStorage.clear();
    sessionStorage.clear();
    
    // 重置所有设置为默认值
    language.value = "zh-CN";
    timezone.value = "Asia/Shanghai";
    selectedTheme.value = "system";
    compactMode.value = false;
    autoSave.value = true;
    enterToSend.value = true;
    defaultModel.value = "";
    
    toast("重置配置成功，请刷新页面");
    showResetConfirm.value = false;
    
    // 延迟刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error("重置配置失败:", error);
    toast("重置配置失败");
  }
}

function exportData() {
  try {
    // 导出所有本地数据
    const data = {
      settings: {
        language: language.value,
        timezone: timezone.value,
        theme: selectedTheme.value,
        compactMode: compactMode.value,
        autoSave: autoSave.value,
        enterToSend: enterToSend.value,
        defaultModel: defaultModel.value,
      },
      localStorage: { ...localStorage },
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seekchat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast("导出数据成功");
  } catch (error) {
    console.error("导出数据失败:", error);
    toast("导出数据失败");
  }
}

function importData() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // 恢复设置
          if (data.settings) {
            language.value = data.settings.language || "zh-CN";
            timezone.value = data.settings.timezone || "Asia/Shanghai";
            selectedTheme.value = data.settings.theme || "system";
            compactMode.value = data.settings.compactMode || false;
            autoSave.value = data.settings.autoSave ?? true;
            enterToSend.value = data.settings.enterToSend ?? true;
            defaultModel.value = data.settings.defaultModel || "";
          }
          
          // 恢复localStorage
          if (data.localStorage) {
            Object.keys(data.localStorage).forEach(key => {
              localStorage.setItem(key, data.localStorage[key]);
            });
          }
          
          toast("导入数据成功，请刷新页面");
          
          // 延迟刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error("导入数据失败:", error);
          toast("导入数据失败，文件格式不正确");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  } catch (error) {
    console.error("导入数据失败:", error);
    toast("导入数据失败");
  }
}
</script>
