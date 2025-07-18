<template>
  <div class="chat-window">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-title">
        {{ session ? session.name : "开始新聊天" }}
      </div>
      <div class="chat-actions">
        <div class="model-selector">
          <select
            v-model="currentModelKey"
            @change="handleModelChange"
            class="model-select"
            :disabled="!session"
          >
            <option value="" disabled>选择模型</option>
            <optgroup
              v-for="provider in availableProviders"
              :key="provider.id"
              :label="provider.name"
            >
              <option
                v-for="model in provider.models.filter((m) => m.enabled)"
                :key="model.id"
                :value="`${provider.id}|${model.id}`"
              >
                {{ model.name }}
              </option>
            </optgroup>
          </select>
        </div>
        <button
          @click="showSettingsModal = true"
          class="settings-button"
          :disabled="!session"
          title="模型设置"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages" ref="chatContainer">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <div class="loading-text">AI正在思考...</div>
        </div>
      </div>
      <div v-else-if="messages.length === 0" class="empty-messages">
        <div class="empty-message-icon">
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
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            ></path>
          </svg>
        </div>
        <div class="empty-message-text">暂无消息</div>
      </div>
      <div v-else class="message-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'user-message': message.role === 'user' }"
        >
          <div class="message-avatar">
            <div v-if="message.role === 'user'" class="user-avatar">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </div>
            <div v-else class="ai-avatar">
              <img
                v-if="getModelInfo(message).logo"
                :src="getModelInfo(message).logo"
                :alt="getModelInfo(message).providerName"
                class="avatar-logo"
                @error="handleAvatarError"
              />
              <svg
                v-else
                class="w-5 h-5 robot-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                ></path>
              </svg>
            </div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">
                {{
                  message.role === "user"
                    ? "我"
                    : getModelInfo(message).modelName
                }}
              </span>
              <span
                v-if="
                  message.role === 'assistant' &&
                  getModelInfo(message).providerName
                "
                class="message-provider"
              >
                {{ getModelInfo(message).providerName }}
              </span>
              <span class="message-time">
                {{ formatTime(message.createdAt) }}
              </span>
            </div>
            <div class="message-text">
              <div v-html="formatMessageContent(message.content)"></div>
            </div>
            <div class="message-footer">
              <button
                @click="copyMessage(message)"
                class="copy-button"
                title="复制消息"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
                复制
              </button>
            </div>
          </div>
        </div>
      </div>
      <div ref="messagesEnd" class="messages-end"></div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          class="message-input"
          rows="3"
          placeholder="输入消息..."
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="loading || !inputMessage.trim()"
          class="send-button"
        >
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            ></path>
          </svg>
        </button>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- 模型设置弹窗 -->
    <div
      v-if="showSettingsModal"
      class="modal-overlay"
      @click="closeSettingsModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">模型设置</h3>
          <button @click="closeSettingsModal" class="modal-close">
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
        <form @submit.prevent="saveSettings" class="modal-form">
          <div class="form-group">
            <label class="form-label">温度</label>
            <div class="temperature-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                v-model="modelSettings.temperature"
                class="temperature-slider"
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                v-model="modelSettings.temperature"
                class="temperature-input"
              />
            </div>
            <p class="form-hint">
              较低的值会使输出更确定，较高的值会使输出更富有创造性
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">上下文长度</label>
            <select v-model="modelSettings.contextLength" class="form-select">
              <option value="-1">无限制</option>
              <option v-for="i in 20" :key="i" :value="i">{{ i }} 消息</option>
            </select>
            <p class="form-hint">控制AI记忆的对话轮数</p>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeSettingsModal"
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
import { ref, onMounted, watch, nextTick } from "vue";
import {
  databaseService,
  type ChatSession,
  type ChatMessage,
  type Provider,
  type ProviderModel,
} from "../services/database";
import { aiService } from "../services/ai";

const props = defineProps<{
  session: ChatSession;
}>();

const messages = ref<ChatMessage[]>([]);
const inputMessage = ref("");
const loading = ref(false);
const error = ref("");
const availableProviders = ref<Provider[]>([]);
const currentModelKey = ref("");
const activeProvider = ref<Provider | null>(null);
const activeModel = ref<ProviderModel | null>(null);
const showSettingsModal = ref(false);
const modelSettings = ref({
  temperature: 0.7,
  contextLength: 10,
});

const chatContainer = ref<HTMLElement>();
const messagesEnd = ref<HTMLElement>();

async function loadMessages() {
  if (!props.session.id) return;
  try {
    messages.value = await databaseService.getMessages(props.session.id);
    error.value = "";
    await nextTick();
    scrollToBottom();
  } catch (err) {
    error.value = "加载消息失败";
    console.error("加载消息失败:", err);
  }
}

async function loadAvailableProviders() {
  try {
    const providers = await databaseService.getAllProviders();
    availableProviders.value = providers.filter(
      (p) => p.enabled && p.models.some((m) => m.enabled)
    );

    // 如果有可用的提供商，自动选择第一个
    if (availableProviders.value.length > 0) {
      const firstProvider = availableProviders.value[0];
      const firstModel = firstProvider.models.find((m) => m.enabled);
      if (firstModel) {
        currentModelKey.value = `${firstProvider.id}|${firstModel.id}`;
        activeProvider.value = firstProvider;
        activeModel.value = firstModel;
      }
    }
  } catch (err) {
    error.value = "加载模型配置失败";
    console.error("加载模型配置失败:", err);
  }
}

function handleModelChange() {
  if (!currentModelKey.value) return;

  const [providerId, modelId] = currentModelKey.value.split("|");
  const provider = availableProviders.value.find((p) => p.id === providerId);
  if (provider) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      activeProvider.value = provider;
      activeModel.value = model;
    }
  }
}

async function sendMessage() {
  if (!props.session.id || !inputMessage.value.trim() || loading.value) return;

  if (!activeProvider.value || !activeModel.value) {
    error.value = "请先选择AI模型";
    return;
  }

  const userMessage: ChatMessage = {
    sessionId: props.session.id,
    role: "user",
    providerId: activeProvider.value.id,
    modelId: activeModel.value.id,
    content: inputMessage.value.trim(),
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };

  try {
    loading.value = true;
    error.value = "";

        // 保存用户消息
    await databaseService.createMessage(userMessage);
    messages.value.push(userMessage);
    inputMessage.value = "";
    
    // 确保滚动到底部
    await nextTick();
    forceScrollToBottom();

    // 调用AI服务获取回复
    const response = await aiService.sendMessage({
      role: "user",
      content: userMessage.content,
      model: activeModel.value.name,
      provider: activeProvider.value,
    });

    const aiMessage: ChatMessage = {
      sessionId: props.session.id,
      role: "assistant",
      providerId: activeProvider.value.id,
      modelId: activeModel.value.id,
      content: response.content,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    await databaseService.createMessage(aiMessage);
    messages.value.push(aiMessage);
    
    // 确保AI回复后滚动到底部
    await nextTick();
    forceScrollToBottom();
  } catch (err) {
    error.value = "发送消息失败";
    console.error("发送消息失败:", err);
  } finally {
    loading.value = false;
  }
}

function scrollToBottom() {
  if (messagesEnd.value) {
    messagesEnd.value.scrollIntoView({ behavior: "smooth" });
  } else if (chatContainer.value) {
    // 备用方法：直接滚动容器到底部
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

// 强制滚动到底部（无动画）
function forceScrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getModelInfo(message: ChatMessage) {
  if (message.role === "user") {
    return {
      providerName: "",
      modelName: "我",
      logo: null,
    };
  }

  const provider = availableProviders.value.find(
    (p) => p.id === message.providerId
  );
  if (!provider) {
    return {
      providerName: "",
      modelName: "AI助手",
      logo: null,
    };
  }

  const model = provider.models.find((m) => m.id === message.modelId);
  return {
    providerName: provider.name,
    modelName: model?.name || "AI助手",
    logo: provider.logo,
  };
}

function handleAvatarError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
  // 显示默认机器人图标
  const robotIcon = target.parentElement?.querySelector(
    ".robot-icon"
  ) as HTMLElement;
  if (robotIcon) {
    robotIcon.style.display = "block";
  }
}

function formatMessageContent(content: string) {
  // 简单的换行处理，可以根据需要扩展为完整的Markdown渲染
  return content.replace(/\n/g, "<br>");
}

function copyMessage(message: ChatMessage) {
  navigator.clipboard
    .writeText(message.content)
    .then(() => {
      console.log("消息已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
    });
}

function closeSettingsModal() {
  showSettingsModal.value = false;
}

function saveSettings() {
  // 这里可以保存设置到数据库
  console.log("保存设置:", modelSettings.value);
  closeSettingsModal();
}

watch(
  () => props.session,
  () => {
    loadMessages();
  }
);

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
);

onMounted(async () => {
  await loadAvailableProviders();
  await loadMessages();
});
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  flex-shrink: 0;
}

.chat-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-selector {
  display: flex;
  align-items: center;
}

.model-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  min-width: 180px;
  background: white;
  cursor: pointer;
}

.model-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.settings-button {
  padding: 6px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-button:hover:not(:disabled) {
  background: #f5f5f5;
}

.settings-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
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

.loading-text {
  color: #666;
  font-size: 14px;
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.empty-message-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message-text {
  font-size: 16px;
}

.message-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}

.message-item {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
  gap: 12px;
}

.message-item.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar {
  background: #1677ff;
  color: white;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar {
  background: #f5f5f5;
  color: #666;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.avatar-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.robot-icon {
  display: none;
}

.message-content {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 70%;
}

.user-message .message-content {
  background: #1677ff;
  color: white;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  gap: 8px;
}

.message-sender {
  font-weight: 500;
}

.message-provider {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.user-message .message-provider {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  color: #999;
  font-size: 11px;
  margin-left: auto;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

.message-footer {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.copy-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.user-message .copy-button {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.user-message .copy-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.messages-end {
  height: 1px;
  margin-bottom: 20px;
}

.chat-input-container {
  padding: 16px;
  border-top: 1px solid #e5e5e5;
  background: white;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  min-height: 40px;
  max-height: 120px;
}

.message-input:focus {
  outline: none;
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.send-button {
  padding: 8px 12px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  background: #4096ff;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 8px;
  color: #ff4d4f;
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
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.temperature-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temperature-slider {
  flex: 1;
  margin: 0;
}

.temperature-input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  text-align: center;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-primary {
  background: #1677ff;
  color: white;
}

.btn-primary:hover {
  background: #4096ff;
}
</style>
