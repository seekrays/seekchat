<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <aside
      :class="[
        'bg-white border-r w-64 flex flex-col transition-all duration-200 z-20',
        siderCollapsed ? 'hidden' : 'block',
        'fixed md:static h-full',
      ]"
      style="min-width: 16rem"
    >
      <!-- 顶部 logo + 标题 -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="flex items-center space-x-3 select-none">
          <img src="/public/tauri.svg" class="h-8 w-8" alt="logo" />
          <span class="text-blue-600 text-2xl font-extrabold tracking-wide"
            >SeekChat</span
          >
        </div>
        <button
          class="md:hidden p-2 rounded hover:bg-gray-100"
          @click="toggleSider"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto">
        <ul class="py-2">
          <li
            v-for="s in sessions"
            :key="s.id"
            @click="selectSession(s)"
            :class="[
              'flex items-center px-5 py-2 cursor-pointer group relative',
              currentSession && String(currentSession.id) == String(s.id)
                ? 'bg-blue-50 font-bold border-l-4 border-blue-500 text-blue-700'
                : 'hover:bg-gray-100',
            ]"
          >
            <span class="flex-1 truncate">{{ s.name }}</span>
            <button
              class="ml-2 text-red-400 hover:text-red-600 opacity-70 group-hover:opacity-100 transition"
              @click.stop="deleteSession(s.id)"
              title="删除会话"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </li>
        </ul>
      </div>
      <!-- 底部按钮 -->
      <div class="p-4 border-t space-y-2">
        <button
          class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 transition"
          @click="createNewSession"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          新建会话
        </button>
        <button
          class="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded-lg shadow hover:bg-gray-300 transition"
          @click="goSettings"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          设置
        </button>
      </div>
    </aside>
    <!-- 遮罩层（移动端侧边栏弹出时） -->
    <div
      v-if="!siderCollapsed"
      class="fixed inset-0 bg-black bg-opacity-20 z-10 md:hidden"
      @click="toggleSider"
    ></div>
    <!-- 主内容区 -->
    <main
      class="flex-1 flex flex-col min-w-0 ml-0 md:ml-64 h-full pl-0 ml-0 !pl-0 !ml-0"
    >
      <!-- 顶部栏（移动端） -->
      <header
        class="flex items-center justify-between bg-white py-3 border-b md:hidden sticky top-0 z-10 pl-0 ml-0 !pl-0 !ml-0"
      >
        <button @click="toggleSider" class="p-2 rounded hover:bg-gray-100">
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
            />
          </svg>
        </button>
        <span class="font-bold text-lg truncate">{{
          currentSession ? currentSession.name : "请选择会话"
        }}</span>
        <button @click="goSettings" class="p-2 rounded hover:bg-gray-100">
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
            />
          </svg>
        </button>
      </header>
      <!-- 聊天窗口 -->
      <div class="flex-1 overflow-y-auto bg-gray-50 pl-0 ml-0 !pl-0 !ml-0">
        <ChatWindow
          v-if="currentSession"
          :session="currentSession"
          class="h-full"
        />
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-300 text-2xl select-none"
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
