<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <aside
      :class="[
        'bg-white border-r w-64 flex flex-col transition-all duration-200',
        { hidden: siderCollapsed },
      ]"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <div class="flex items-center space-x-2">
          <span class="text-blue-600 text-2xl font-bold">🤖</span>
          <span class="font-bold text-lg">SeekChat</span>
        </div>
        <button class="md:hidden" @click="toggleSider">
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
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <ul>
          <li
            v-for="s in sessions"
            :key="s.id"
            @click="selectSession(s)"
            :class="[
              'px-4 py-2 cursor-pointer hover:bg-blue-50',
              currentSession && currentSession.id === s.id
                ? 'bg-blue-100 font-bold'
                : '',
            ]"
          >
            <div class="flex justify-between items-center">
              <span>{{ s.name }}</span>
              <button
                class="text-red-400 hover:text-red-600"
                @click.stop="deleteSession(s.id)"
              >
                ✕
              </button>
            </div>
          </li>
        </ul>
      </div>
      <div class="p-4 border-t space-y-2">
        <button
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          @click="createNewSession"
        >
          新建会话
        </button>
        <button
          class="w-full bg-gray-200 py-2 rounded hover:bg-gray-300"
          @click="goSettings"
        >
          设置
        </button>
      </div>
    </aside>
    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col">
      <header
        class="flex items-center justify-between bg-white px-4 py-2 border-b md:hidden"
      >
        <button @click="toggleSider">
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
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
        <span class="font-bold">{{
          currentSession ? currentSession.name : "请选择会话"
        }}</span>
        <button @click="goSettings">
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
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
        </button>
      </header>
      <div class="flex-1 overflow-y-auto">
        <ChatWindow v-if="currentSession" :session="currentSession" />
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-400"
        >
          请选择会话
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import ChatWindow from "../components/ChatWindow.vue";
import { databaseService, type ChatSession } from "../services/database";

const sessions = ref<ChatSession[]>([]);
const currentSession = ref<ChatSession | null>(null);
const siderCollapsed = ref(window.innerWidth < 768);
const router = useRouter();

function toggleSider() {
  siderCollapsed.value = !siderCollapsed.value;
}

function goSettings() {
  router.push("/settings");
}

function selectSession(s: ChatSession) {
  currentSession.value = s;
  if (window.innerWidth < 768) {
    siderCollapsed.value = true;
  }
}

async function loadSessions() {
  try {
    sessions.value = await databaseService.getSessions();
    if (!currentSession.value && sessions.value.length > 0) {
      currentSession.value = sessions.value[0];
    }
  } catch (error) {
    console.error("加载会话列表失败:", error);
  }
}

async function createNewSession() {
  try {
    const newSession = await databaseService.createSession(
      `新会话${sessions.value.length + 1}`
    );
    sessions.value.unshift(newSession);
    currentSession.value = newSession;
  } catch (error) {
    console.error("创建会话失败:", error);
  }
}

async function deleteSession(id?: number) {
  if (!id) return;
  try {
    await databaseService.deleteSession(id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
    if (currentSession.value && currentSession.value.id === id) {
      currentSession.value =
        sessions.value.length > 0 ? sessions.value[0] : null;
    }
  } catch (error) {
    console.error("删除会话失败:", error);
  }
}

onMounted(async () => {
  await databaseService.updateAllPendingMessagesToError();
  await loadSessions();
});
</script>
