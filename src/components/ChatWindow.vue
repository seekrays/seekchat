<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <div class="flex-1 overflow-y-auto pr-4 pt-4 pb-4 pl-4 space-y-4">
      <div v-for="message in messages" :key="message.id" class="flex">
        <div
          :class="[
            'max-w-[80%] rounded-lg p-3',
            message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100',
          ]"
        >
          <div class="text-sm text-gray-600 mb-1">
            {{ message.role === "user" ? "我" : "AI" }}
          </div>
          <div class="whitespace-pre-wrap">{{ message.content }}</div>
        </div>
      </div>
      <div v-if="loading" class="flex">
        <div class="bg-gray-100 rounded-lg p-3">
          <div class="animate-pulse">正在思考...</div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t pr-4 pt-4 pb-4 pl-4">
      <div class="flex space-x-2">
        <textarea
          v-model="inputMessage"
          class="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="输入消息..."
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="loading || !inputMessage.trim()"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
      <div v-if="error" class="mt-2 text-red-500 text-sm">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
  databaseService,
  type ChatSession,
  type ChatMessage,
} from "../services/database";
import { aiService } from "../services/ai";

const props = defineProps<{
  session: ChatSession;
}>();

const messages = ref<ChatMessage[]>([]);
const inputMessage = ref("");
const loading = ref(false);
const error = ref("");

async function loadMessages() {
  if (!props.session.id) return;
  try {
    messages.value = await databaseService.getMessages(props.session.id);
    error.value = "";
  } catch (err) {
    error.value = "加载消息失败";
    console.error("加载消息失败:", err);
  }
}

async function sendMessage() {
  if (!props.session.id || !inputMessage.value.trim() || loading.value) return;

  const activeModel = aiService.getActiveModel();
  if (!activeModel) {
    error.value = "请先配置AI模型";
    return;
  }

  const userMessage: ChatMessage = {
    sessionId: props.session.id,
    role: "user",
    providerId: 1, // TODO: 从设置中获取当前提供商ID
    modelId: activeModel.id || 1,
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

    // 调用AI服务获取回复
    const response = await aiService.sendMessage({
      role: "user",
      content: userMessage.content,
      model: activeModel.name,
    });

    const aiMessage: ChatMessage = {
      sessionId: props.session.id,
      role: "assistant",
      providerId: 1,
      modelId: activeModel.id || 1,
      content: response.content,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    await databaseService.createMessage(aiMessage);
    messages.value.push(aiMessage);
  } catch (err) {
    error.value = "发送消息失败";
    console.error("发送消息失败:", err);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.session,
  () => {
    loadMessages();
  }
);

onMounted(async () => {
  await aiService.init();
  await loadMessages();
});
</script>
