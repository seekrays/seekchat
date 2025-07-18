<template>
  <div class="settings-page">
    <div class="settings-header">
      <button @click="goBack" class="back-button">
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        返回
      </button>
    </div>

    <div class="settings-body">
      <div class="settings-sider">
        <div class="settings-menu">
          <div
            v-for="item in menuItems"
            :key="item.key"
            @click="selectMenuItem(item.key)"
            class="menu-item"
            :class="{ active: currentMenuKey === item.key }"
          >
            <svg
              class="menu-icon w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="item.key === 'model-services'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
              <path
                v-else-if="item.key === 'general-settings'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
              <path
                v-else-if="item.key === 'about'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
              <path
                v-else-if="item.key === 'mcp-settings'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <span class="menu-text">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="settings-content">
        <component
          :is="currentComponent"
          v-bind="currentComponentProps"
          @selectProvider="handleSelectProvider"
          @back="handleBack"
          @updated="handleProviderUpdated"
          @deleted="handleProviderDeleted"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import ModelServices from "../components/settings/ModelServices.vue";
import ProviderSettings from "../components/settings/ProviderSettings.vue";
import GeneralSettings from "../components/settings/GeneralSettings.vue";
import AboutSection from "../components/settings/AboutSection.vue";
import MCPSettings from "../components/settings/MCPSettings.vue";
import { databaseService, type Provider } from "../services/database";

const router = useRouter();
const currentMenuKey = ref("model-services");
const selectedProvider = ref<Provider | null>(null);

const menuItems = [
  { key: "model-services", label: "模型服务" },
  { key: "mcp-settings", label: "MCP 设置" },
  { key: "general-settings", label: "通用设置" },
  { key: "about", label: "关于" },
];

const currentComponent = computed(() => {
  switch (currentMenuKey.value) {
    case "model-services":
      return ModelServices;
    case "provider-settings":
      return ProviderSettings;
    case "general-settings":
      return GeneralSettings;
    case "about":
      return AboutSection;
    case "mcp-settings":
      return MCPSettings;
    default:
      return ModelServices;
  }
});

const currentComponentProps = computed(() => {
  if (currentMenuKey.value === "provider-settings" && selectedProvider.value) {
    return { provider: selectedProvider.value };
  }
  return {};
});

function goBack() {
  router.push("/");
}

function selectMenuItem(key: string) {
  currentMenuKey.value = key;
  selectedProvider.value = null;
}

function handleSelectProvider(provider: Provider) {
  selectedProvider.value = provider;
  currentMenuKey.value = "provider-settings";
}

function handleBack() {
  currentMenuKey.value = "model-services";
  selectedProvider.value = null;
}

function handleProviderUpdated(provider: Provider) {
  selectedProvider.value = provider;
}

function handleProviderDeleted() {
  currentMenuKey.value = "model-services";
  selectedProvider.value = null;
}

onMounted(() => {
  // 初始化时加载数据
});
</script>

<style scoped>
.settings-page {
  height: 100vh;
  background-color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #eaeaea;
  z-index: 10;
}

.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f5f5f5;
}

.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-sider {
  width: 200px;
  background-color: #f7f7f8;
  border-right: 1px solid #eaeaea;
  overflow: hidden;
}

.settings-menu {
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
  margin: 0;
}

.menu-item:hover {
  background-color: #e6f4ff;
}

.menu-item.active {
  background-color: #e6f4ff;
  color: #1677ff;
  font-weight: 500;
}

.menu-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.menu-text {
  font-size: 14px;
}

.settings-content {
  flex: 1;
  background-color: #fff;
  overflow-y: auto;
}
</style>
