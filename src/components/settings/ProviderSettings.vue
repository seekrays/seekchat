<template>
  <div class="provider-settings settings-content">
    <div class="provider-header">
      <div class="provider-header-left">
        <button @click="goBack" class="btn btn-back">
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          返回
        </button>
        <div class="provider-title">
          <div class="provider-header-logo-container">
            <img
              v-if="provider.logo"
              :src="provider.logo"
              :alt="provider.name"
              class="provider-header-logo"
              @error="handleLogoError"
            />
            <div v-else class="provider-header-logo-text">
              {{ provider.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <h2>{{ provider.name }} 设置</h2>
        </div>
      </div>
      <div class="provider-header-right">
        <button
          v-if="provider.isCustom"
          @click="confirmDeleteProvider"
          class="btn btn-danger"
        >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
          删除提供商
        </button>
      </div>
    </div>

    <div class="provider-settings-container">
      <!-- API 设置 -->
      <div class="settings-card">
        <div class="settings-card-header">
          <h3 class="settings-card-title">API 设置</h3>
        </div>
        <div class="settings-card-body">
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
              <p class="font-medium">API 设置信息</p>
              <p class="text-sm">
                配置您的API基础URL和密钥以连接到AI服务提供商
              </p>
            </div>
          </div>

          <form @submit.prevent="saveProvider" class="provider-form">
            <div class="form-group">
              <label class="form-label">API Base URL *</label>
              <input
                v-model="editForm.baseUrl"
                class="form-input"
                required
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input
                v-model="editForm.apiKey"
                type="password"
                class="form-input"
                placeholder="输入API密钥"
              />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">保存</button>
              <button
                type="button"
                @click="testConnection"
                class="btn btn-secondary"
                :disabled="testing"
              >
                {{ testing ? "测试中..." : "测试连接" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 模型设置 -->
      <div class="settings-card">
        <div class="settings-card-header">
          <h3 class="settings-card-title">模型设置</h3>
          <button @click="showAddModelModal = true" class="btn btn-primary">
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
            添加模型
          </button>
        </div>
        <div class="settings-card-body">
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
              <p class="font-medium">模型设置提示</p>
              <p class="text-sm">启用或禁用模型，编辑模型信息</p>
            </div>
          </div>

          <div v-if="provider.models.length === 0" class="empty-models">
            <div class="empty-models-text">暂无可用模型</div>
          </div>

          <div v-else class="models-card-container">
            <div
              v-for="model in provider.models"
              :key="model.id"
              class="model-card"
            >
              <div class="model-card-header">
                <div class="model-card-title">
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    :style="{ color: '#1677ff' }"
                  >
                    <path
                      v-if="isChatModel(model)"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  <span>{{ model.id }}</span>
                </div>
                <div class="model-card-actions">
                  <div class="model-switch">
                    <input
                      type="checkbox"
                      :checked="model.enabled"
                      @change="toggleModel(model)"
                      class="switch-input"
                    />
                    <label class="switch-label"></label>
                  </div>
                  <button
                    @click="editModel(model)"
                    class="btn btn-icon"
                    title="编辑模型"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDeleteModel(model)"
                    class="btn btn-icon btn-danger"
                    title="删除模型"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="model-card-content">
                <div class="model-status">
                  <span class="model-name">{{ model.name }}</span>
                  <span
                    class="model-tag"
                    :class="{
                      enabled: model.enabled,
                      disabled: !model.enabled,
                    }"
                  >
                    {{ model.enabled ? "已启用" : "已禁用" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加模型弹窗 -->
    <div
      v-if="showAddModelModal"
      class="modal-overlay"
      @click="closeAddModelModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">添加模型</h3>
          <button @click="closeAddModelModal" class="modal-close">
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
        <form @submit.prevent="addModel" class="modal-form">
          <div class="form-group">
            <label class="form-label">模型ID *</label>
            <input
              v-model="newModel.id"
              class="form-input"
              required
              placeholder="gpt-3.5-turbo"
            />
          </div>
          <div class="form-group">
            <label class="form-label">模型名称</label>
            <input
              v-model="newModel.name"
              class="form-input"
              placeholder="模型显示名称（可选）"
            />
          </div>
          <div class="model-form-tips">
            模型ID用于API调用，模型名称用于界面显示
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeAddModelModal"
              class="btn btn-cancel"
            >
              取消
            </button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑模型弹窗 -->
    <div
      v-if="showEditModelModal"
      class="modal-overlay"
      @click="closeEditModelModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑模型</h3>
          <button @click="closeEditModelModal" class="modal-close">
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
        <form @submit.prevent="saveEditModel" class="modal-form">
          <div class="form-group">
            <label class="form-label">模型ID *</label>
            <input
              v-model="editModelForm.id"
              class="form-input"
              required
              disabled
            />
          </div>
          <div class="form-group">
            <label class="form-label">模型名称</label>
            <input
              v-model="editModelForm.name"
              class="form-input"
              placeholder="模型显示名称（可选）"
            />
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeEditModelModal"
              class="btn btn-cancel"
            >
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
import { ref, reactive, onMounted } from "vue";
import {
  databaseService,
  type Provider,
  type ProviderModel,
} from "../../services/database";
import { notification } from "../../services/notification";

interface Props {
  provider: Provider;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  back: [];
  updated: [provider: Provider];
  deleted: [];
}>();

const editForm = reactive({
  baseUrl: props.provider.baseUrl || "",
  apiKey: props.provider.apiKey || "",
});

const showAddModelModal = ref(false);
const showEditModelModal = ref(false);
const testing = ref(false);
const newModel = ref({
  id: "",
  name: "",
});
const editModelForm = ref({
  id: "",
  name: "",
});

function goBack() {
  emit("back");
}

async function testConnection() {
  if (!editForm.baseUrl) {
    notification.warning("请先输入API Base URL");
    return;
  }

  testing.value = true;
  try {
    const response = await fetch(`${editForm.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${editForm.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      notification.success("连接测试成功！");
    } else {
      notification.error(
        "连接测试失败",
        `${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    notification.error("连接测试失败", error.message);
  } finally {
    testing.value = false;
  }
}

async function saveProvider() {
  try {
    const updatedProvider = {
      ...props.provider,
      baseUrl: editForm.baseUrl,
      apiKey: editForm.apiKey,
    };
    await databaseService.updateProvider(updatedProvider);
    emit("updated", updatedProvider);
    notification.success("保存成功");
  } catch (error) {
    console.error("保存提供商失败:", error);
    notification.error("保存失败", "请检查配置信息");
  }
}

async function toggleModel(model: ProviderModel) {
  try {
    const updatedModel = { ...model, enabled: !model.enabled };
    await databaseService.updateProviderModel(
      props.provider.id,
      model.id,
      updatedModel
    );

    // 更新本地状态
    const modelIndex = props.provider.models.findIndex(
      (m) => m.id === model.id
    );
    if (modelIndex !== -1) {
      props.provider.models[modelIndex] = updatedModel;
    }

    emit("updated", props.provider);
    notification.success(updatedModel.enabled ? "模型已启用" : "模型已禁用");
  } catch (error) {
    console.error("切换模型状态失败:", error);
    notification.error("操作失败", "请稍后重试");
  }
}

function closeAddModelModal() {
  showAddModelModal.value = false;
  newModel.value = {
    id: "",
    name: "",
  };
}

async function addModel() {
  try {
    const model = {
      id: newModel.value.id,
      name: newModel.value.name || newModel.value.id,
      enabled: true,
    };

    await databaseService.addModelToProvider(props.provider.id, model);

    // 更新本地状态
    props.provider.models.push(model);

    closeAddModelModal();
    emit("updated", props.provider);
    notification.success("添加模型成功");
  } catch (error) {
    console.error("添加模型失败:", error);
    notification.error("添加模型失败", "请检查模型信息");
  }
}

function editModel(model: ProviderModel) {
  editModelForm.value = {
    id: model.id,
    name: model.name,
  };
  showEditModelModal.value = true;
}

function closeEditModelModal() {
  showEditModelModal.value = false;
  editModelForm.value = {
    id: "",
    name: "",
  };
}

async function saveEditModel() {
  try {
    // 获取原始模型状态
    const originalModel = props.provider.models.find(
      (m) => m.id === editModelForm.value.id
    );

    const updatedModel = {
      ...editModelForm.value,
      enabled: originalModel?.enabled ?? true, // 保持原有状态
    };

    await databaseService.updateProviderModel(
      props.provider.id,
      editModelForm.value.id,
      updatedModel
    );

    // 更新本地状态
    const modelIndex = props.provider.models.findIndex(
      (m) => m.id === editModelForm.value.id
    );
    if (modelIndex !== -1) {
      props.provider.models[modelIndex] = {
        ...props.provider.models[modelIndex],
        ...updatedModel,
      };
    }

    closeEditModelModal();
    emit("updated", props.provider);
    notification.success("保存模型成功");
  } catch (error) {
    console.error("保存模型失败:", error);
    notification.error("保存模型失败", "请检查模型信息");
  }
}

async function confirmDeleteModel(model: ProviderModel) {
  const confirmed = await notification.confirm({
    type: "danger",
    title: "删除模型",
    message: `确定要删除模型 ${model.name} 吗？此操作不可撤销。`,
    confirmText: "删除",
    cancelText: "取消",
  });

  if (confirmed) {
    deleteModel(model);
  }
}

async function deleteModel(model: ProviderModel) {
  try {
    await databaseService.deleteProviderModel(props.provider.id, model.id);

    // 更新本地状态
    const modelIndex = props.provider.models.findIndex(
      (m) => m.id === model.id
    );
    if (modelIndex !== -1) {
      props.provider.models.splice(modelIndex, 1);
    }

    emit("updated", props.provider);
    notification.success("删除模型成功");
  } catch (error) {
    console.error("删除模型失败:", error);
    notification.error("删除模型失败", "请稍后重试");
  }
}

async function confirmDeleteProvider() {
  const confirmed = await notification.confirm({
    type: "danger",
    title: "删除提供商",
    message: `确定要删除提供商 ${props.provider.name} 吗？此操作不可撤销。`,
    confirmText: "删除",
    cancelText: "取消",
  });

  if (confirmed) {
    deleteProvider();
  }
}

async function deleteProvider() {
  try {
    await databaseService.deleteProvider(props.provider.id);
    emit("deleted");
    notification.success("删除提供商成功");
  } catch (error) {
    console.error("删除提供商失败:", error);
    notification.error("删除提供商失败", "请稍后重试");
  }
}

function isChatModel(model: ProviderModel): boolean {
  const chatKeywords = [
    "chat",
    "gpt",
    "claude",
    "llama",
    "qwen",
    "moonshot",
    "deepseek",
    "gemini",
  ];
  const codeKeywords = ["code", "coder", "coding", "completion"];

  const modelName = model.id.toLowerCase();
  const modelDisplayName = model.name.toLowerCase();

  // 如果明确包含代码相关关键字，则认为是代码模型
  if (
    codeKeywords.some(
      (keyword) =>
        modelName.includes(keyword) || modelDisplayName.includes(keyword)
    )
  ) {
    return false;
  }

  // 如果包含聊天相关关键字，则认为是聊天模型
  if (
    chatKeywords.some(
      (keyword) =>
        modelName.includes(keyword) || modelDisplayName.includes(keyword)
    )
  ) {
    return true;
  }

  // 默认认为是聊天模型
  return true;
}

function handleLogoError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
  target.nextElementSibling?.classList.remove("hidden");
}

onMounted(() => {
  // 初始化表单数据
  editForm.baseUrl = props.provider.baseUrl || "";
  editForm.apiKey = props.provider.apiKey || "";
});
</script>

<style scoped>
.provider-settings {
  padding: 20px;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.provider-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-header-logo-container {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-header-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.provider-header-logo-text {
  font-size: 16px;
  font-weight: bold;
  color: #1677ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.provider-settings-container {
  max-width: 700px;
}

.settings-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.settings-card-body {
  padding: 20px;
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

.btn-back {
  background: #f5f5f5;
  color: #666;
}

.btn-back:hover {
  background: #e5e5e5;
}

.btn-primary {
  background: #1677ff;
  color: white;
}

.btn-primary:hover {
  background: #4096ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e5e5;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
}

.btn-icon {
  padding: 4px;
  background: transparent;
  color: #666;
}

.btn-icon:hover {
  background: #f5f5f5;
}

.btn-icon.btn-danger {
  color: #ff4d4f;
}

.btn-icon.btn-danger:hover {
  background: #fff2f0;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.alert {
  margin-bottom: 16px;
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

.provider-form {
  max-width: 100%;
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

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 24px;
}

.empty-models {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  background: #fafafa;
  border-radius: 8px;
  margin-top: 16px;
}

.empty-models-text {
  color: #888;
  font-size: 14px;
}

.models-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.model-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.model-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.model-card-header {
  background: #fafafa;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-card-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.model-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-card-content {
  padding: 12px 16px;
}

.model-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-name {
  font-size: 12px;
  color: #666;
}

.model-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.model-tag.enabled {
  background: #f6ffed;
  color: #52c41a;
}

.model-tag.disabled {
  background: #fff2f0;
  color: #ff4d4f;
}

.model-switch {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 16px;
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
  border-radius: 16px;
}

.switch-label:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.switch-input:checked + .switch-label {
  background-color: #1677ff;
}

.switch-input:checked + .switch-label:before {
  transform: translateX(12px);
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.model-form-tips {
  color: #888;
  font-size: 12px;
  margin-top: 8px;
  line-height: 1.5;
}
</style>
