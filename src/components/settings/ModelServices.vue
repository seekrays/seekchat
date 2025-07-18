<template>
  <div class="settings-content">
    <div class="settings-card">
      <div class="settings-card-header">
        <h2 class="settings-card-title">模型服务</h2>
        <button @click="showAddModal = true" class="btn btn-primary">
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          新增提供商
        </button>
      </div>

      <div class="alert alert-info">
        <svg
          class="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <p class="font-medium">选择提供商</p>
          <p class="text-sm">
            选择并配置您的AI模型提供商，点击卡片进入详细配置
          </p>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="providers.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <svg
            class="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
        </div>
        <p class="empty-state-text">暂无模型提供商</p>
        <p class="empty-state-description">
          点击上方按钮新增您的第一个模型提供商
        </p>
      </div>

      <div v-else class="provider-grid">
        <div
          v-for="provider in providers"
          :key="provider.id"
          class="provider-grid-item"
          :class="{ 'provider-disabled': !provider.enabled }"
        >
          <div class="provider-content" @click="handleSelectProvider(provider)">
            <div class="provider-logo-container">
              <img
                v-if="provider.logo"
                :src="provider.logo"
                :alt="provider.name"
                class="provider-logo"
                @error="handleLogoError"
              />
              <div v-else class="provider-logo-text">
                {{ provider.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="provider-info">
              <div class="provider-name">{{ provider.name }}</div>
              <div class="provider-model-count">
                <span class="model-count-tag"
                  >{{ provider.models.length }} 个模型</span
                >
                <span class="provider-url">{{ provider.baseUrl }}</span>
              </div>
            </div>
          </div>
          <div class="provider-actions">
            <div class="provider-switch">
              <input
                type="checkbox"
                :checked="provider.enabled"
                @change="handleProviderToggle(provider)"
                @click.stop
                class="switch-input"
              />
              <label class="switch-label"></label>
            </div>
          </div>
        </div>

        <!-- 添加提供商卡片 -->
        <div
          class="provider-grid-item add-provider-item"
          @click="showAddModal = true"
        >
          <div class="add-provider-content">
            <div class="add-icon">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </div>
            <div class="add-text">新增提供商</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加提供商弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">新增提供商</h3>
          <button @click="closeAddModal" class="modal-close">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <form @submit.prevent="handleAddProvider" class="modal-form">
          <div class="form-group">
            <label class="form-label">名称 *</label>
            <input
              v-model="newProvider.name"
              class="form-input"
              required
              placeholder="例如：OpenAI"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Base URL *</label>
            <input
              v-model="newProvider.baseUrl"
              class="form-input"
              required
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div class="form-group">
            <label class="form-label">API Key</label>
            <input
              v-model="newProvider.apiKey"
              type="password"
              class="form-input"
              placeholder="可选"
            />
          </div>
          <div class="form-group">
            <label class="form-label">模型ID *</label>
            <input
              v-model="newProvider.modelId"
              class="form-input"
              required
              placeholder="gpt-3.5-turbo"
            />
          </div>
          <div class="form-group">
            <label class="form-label">模型名称</label>
            <input
              v-model="newProvider.modelName"
              class="form-input"
              placeholder="模型显示名称（可选）"
            />
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeAddModal" class="btn btn-cancel">
              取消
            </button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { databaseService, type Provider } from "../../services/database";
import { notification } from "../../services/notification";

const emit = defineEmits<{
  selectProvider: [provider: Provider];
}>();

const providers = ref<Provider[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const newProvider = ref({
  name: "",
  baseUrl: "",
  apiKey: "",
  modelId: "",
  modelName: "",
});

async function loadProviders() {
  loading.value = true;
  try {
    providers.value = await databaseService.getAllProviders();
  } catch (error) {
    console.error("加载提供商失败:", error);
    notification.error("加载提供商失败", "请刷新页面重试");
  } finally {
    loading.value = false;
  }
}

function handleSelectProvider(provider: Provider) {
  emit("selectProvider", provider);
}

async function handleProviderToggle(provider: Provider) {
  try {
    const updatedProvider = { ...provider, enabled: !provider.enabled };
    await databaseService.updateProvider(updatedProvider);
    await loadProviders();
    notification.success(
      updatedProvider.enabled ? "提供商已启用" : "提供商已禁用"
    );
  } catch (error) {
    console.error("切换提供商状态失败:", error);
    notification.error("操作失败", "请稍后重试");
  }
}

function closeAddModal() {
  showAddModal.value = false;
  newProvider.value = {
    name: "",
    baseUrl: "",
    apiKey: "",
    modelId: "",
    modelName: "",
  };
}

function handleLogoError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
  // 显示文字logo
  const textElement = target.parentElement?.querySelector(
    ".provider-logo-text"
  ) as HTMLElement;
  if (textElement) {
    textElement.style.display = "flex";
  }
}

async function handleAddProvider() {
  try {
    const provider = await databaseService.createProvider({
      name: newProvider.value.name,
      baseUrl: newProvider.value.baseUrl,
      apiKey: newProvider.value.apiKey,
      enabled: true,
    });

    // 添加模型
    if (newProvider.value.modelId) {
      await databaseService.addModelToProvider(provider.id, {
        id: newProvider.value.modelId,
        name: newProvider.value.modelName || newProvider.value.modelId,
        enabled: true,
      });
    }

    closeAddModal();
    await loadProviders();
    notification.success("新增提供商成功");
  } catch (error) {
    console.error("新增提供商失败:", error);
    notification.error("新增提供商失败", "请检查配置信息");
  }
}

onMounted(loadProviders);
</script>

<style scoped>
.settings-content {
  padding: 20px;
}

.settings-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
}

.settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-card-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1677ff;
  color: white;
}

.btn-primary:hover {
  background: #4096ff;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.alert {
  margin: 16px 20px;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
}

.alert-info {
  background: #f0f7ff;
  border: 1px solid #d4edda;
  color: #0c5460;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.empty-state-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 14px;
  color: #999;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.provider-grid-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 92px;
}

.provider-grid-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.provider-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.provider-logo-container {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.provider-logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #1677ff;
}

.provider-info {
  flex: 1;
}

.provider-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.provider-model-count {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-count-tag {
  font-size: 12px;
  background: #f0f0f0;
  color: #666;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.provider-url {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.provider-actions {
  display: flex;
  align-items: center;
}

.provider-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.switch-label:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.switch-input:checked + .switch-label {
  background-color: #1677ff;
}

.switch-input:checked + .switch-label:before {
  transform: translateX(20px);
}

.add-provider-item {
  border: 1px dashed #d9d9d9;
  background: #fafafa;
  justify-content: center;
}

.add-provider-item:hover {
  border-color: #1677ff;
  background: #f0f7ff;
}

.add-provider-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
}

.add-icon {
  margin-bottom: 8px;
  color: #1677ff;
}

.add-text {
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  color: #666;
}

.modal-close:hover {
  background: #f5f5f5;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
