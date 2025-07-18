<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import Notification from "./components/common/Notification.vue";
import { setNotificationInstance } from "./services/notification";

const greetMsg = ref("");
const name = ref("");
const notificationRef = ref();

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsg.value = await invoke("greet", { name: name.value });
}

onMounted(() => {
  // 初始化通知实例
  if (notificationRef.value) {
    setNotificationInstance(notificationRef.value);
  }
});
</script>

<template>
  <div class="font-sans bg-gray-50 min-h-screen">
    <router-view />
    <!-- 通知组件 -->
    <Notification ref="notificationRef" />
  </div>
</template>
