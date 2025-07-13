import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Chat from "../pages/Chat.vue";
import Settings from "../pages/Settings.vue";
import ModelSettings from "../pages/ModelSettings.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "chat",
      component: Chat,
    },
    {
      path: "/welcome",
      name: "home",
      component: Home,
    },
    {
      path: "/chat",
      name: "chat-alias",
      component: Chat,
    },
    {
      path: "/settings",
      name: "settings",
      component: Settings,
    },
    {
      path: "/settings/model",
      name: "model-settings",
      component: ModelSettings,
    },
  ],
});

export default router;
