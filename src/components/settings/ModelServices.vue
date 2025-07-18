<template>
  <div>
    <!-- 页面头部 -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">模型服务</h2>
        <button
          @click="showAdd = true"
          class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          新增服务
        </button>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-blue-600 mr-2"
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
            <p class="text-blue-800 font-medium">选择和配置模型服务</p>
            <p class="text-blue-600 text-sm mt-1">
              点击服务卡片进行配置，切换开关启用或禁用服务
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务网格 -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>

    <div
      v-else-if="providers.length === 0"
      class="bg-white rounded-lg shadow-sm p-12 text-center"
    >
      <div class="text-gray-400 mb-4">
        <svg
          class="w-16 h-16 mx-auto"
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
      <p class="text-gray-500 text-lg">暂无模型服务</p>
      <p class="text-gray-400 mt-2">点击上方按钮新增你的第一个模型服务</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- 服务卡片 -->
      <div
        v-for="provider in providers"
        :key="provider.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        :class="{
          'ring-2 ring-blue-500':
            selectedProvider && selectedProvider.id === provider.id,
        }"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div
                class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              >
                {{ provider.name.charAt(0).toUpperCase() }}
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ provider.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ getProviderModelsCount(provider) }} 个模型
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :checked="provider.enabled"
                  @change="toggleProviderEnabled(provider)"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-600">
                  {{ provider.enabled ? "启用" : "禁用" }}
                </span>
              </div>
            </div>
          </div>

          <div class="text-sm text-gray-600 mb-4">
            <p class="truncate">{{ provider.baseUrl }}</p>
            <p class="text-xs text-gray-400 mt-1">
              {{ provider.description || "无描述" }}
            </p>
          </div>

          <div class="flex items-center justify-between">
            <button
              @click="selectProvider(provider)"
              class="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-4 h-4 mr-1"
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
              配置
            </button>
            <button
              @click="confirmDeleteProvider(provider)"
              class="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-4 h-4 mr-1"
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
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 添加新服务卡片 -->
      <div
        @click="showAdd = true"
        class="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 cursor-pointer group"
      >
        <div class="p-6 text-center">
          <div
            class="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-6 h-6 text-gray-400 group-hover:text-blue-600"
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
          <h3
            class="text-lg font-medium text-gray-900 group-hover:text-blue-600"
          >
            新增服务
          </h3>
          <p class="text-sm text-gray-500 mt-1">添加新的模型服务</p>
        </div>
      </div>
    </div>

    <!-- 服务详情侧边栏 -->
    <div
      v-if="selectedProvider"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">
              配置服务：{{ selectedProvider.name }}
            </h2>
            <button
              @click="selectedProvider = null"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- 服务基本信息 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <form @submit.prevent="saveEditProvider" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >名称</label
                  >
                  <input
                    v-model="editProvider.name"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Base URL</label
                  >
                  <input
                    v-model="editProvider.baseUrl"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >API Key</label
                >
                <input
                  v-model="editProvider.apiKey"
                  type="password"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="可选"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >描述</label
                >
                <textarea
                  v-model="editProvider.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="服务描述（可选）"
                />
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  保存更改
                </button>
                <button
                  type="button"
                  @click="resetEditProvider"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  重置
                </button>
                <button
                  type="button"
                  v-if="!selectedProvider.enabled"
                  @click="activateProvider(selectedProvider)"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  激活服务
                </button>
              </div>
            </form>
          </div>

          <!-- 模型管理 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">模型管理</h3>
              <div class="flex gap-2">
                <button
                  @click="showAddModelModal = true"
                  class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  新增模型
                </button>
                <button
                  @click="batchDeleteModels"
                  :disabled="!selectedModels.length"
                  class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  批量删除
                </button>
              </div>
            </div>

            <div
              v-if="modelsOfProvider.length === 0"
              class="text-center py-8 text-gray-500"
            >
              <svg
                class="w-12 h-12 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v0a2 2 0 002 2h14a2 2 0 002-2v0a2 2 0 00-2-2M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2"
                ></path>
              </svg>
              <p>暂无模型</p>
              <p class="text-sm mt-1">点击上方按钮新增模型</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(model, idx) in modelsOfProvider"
                :key="model.id"
                class="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                :class="{
                  'ring-2 ring-blue-500':
                    model.id && selectedModels.includes(model.id),
                }"
              >
                <input
                  type="checkbox"
                  v-model="selectedModels"
                  :value="model.id"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-3"
                />
                <div class="flex-1">
                  <div class="flex items-center">
                    <span class="font-medium text-gray-900">{{
                      model.name
                    }}</span>
                    <span
                      class="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >{{ model.group }}</span
                    >
                    <span
                      v-if="model.enabled"
                      class="ml-2 px-2 py-1 bg-green-100 text-green-600 text-xs rounded"
                      >已启用</span
                    >
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    @click="editModel(model)"
                    class="p-1 text-blue-600 hover:bg-blue-100 rounded"
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
                    @click="
                      model.enabled
                        ? deactivateModel(model)
                        : activateModel(model)
                    "
                    class="p-1 hover:bg-gray-100 rounded"
                    :class="model.enabled ? 'text-gray-600' : 'text-green-600'"
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDeleteModel(model)"
                    class="p-1 text-red-600 hover:bg-red-100 rounded"
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
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增服务弹窗 -->
    <div
      v-if="showAdd"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900">新增模型服务</h3>
            <button
              @click="showAdd = false"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <form @submit.prevent="addProvider" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >名称 *</label
            >
            <input
              v-model="newProvider.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="例如：OpenAI"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Base URL *</label
            >
            <input
              v-model="newProvider.url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >API Key</label
            >
            <input
              v-model="newProvider.apiKey"
              type="password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="可选"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >描述</label
            >
            <textarea
              v-model="newProvider.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="服务描述（可选）"
            />
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              @click="showAdd = false"
              class="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 新增/编辑模型弹窗 -->
    <div
      v-if="showAddModelModal || editModelModal"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900">
              {{ editModelModal ? "编辑模型" : "新增模型" }}
            </h3>
            <button
              @click="closeModelModal"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <form
          @submit.prevent="editModelModal ? saveEditModel() : addModel()"
          class="p-6 space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >名称 *</label
            >
            <input
              v-model="modelForm.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="例如：gpt-3.5-turbo"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >类型 *</label
            >
            <input
              v-model="modelForm.group"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="例如：chat"
            />
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              @click="closeModelModal"
              class="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import {
  databaseService,
  type Provider,
  type ProviderModel,
} from "../../services/database";

const providers = ref<Provider[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const newProvider = ref({
  name: "",
  url: "",
  apiKey: "",
  description: "",
});
const selectedProvider = ref<Provider | null>(null);
const editProvider = ref<any>({});
const modelsOfProvider = computed(() =>
  selectedProvider.value ? selectedProvider.value.models : []
);

// 获取指定provider的模型数量的辅助函数
const getProviderModelsCount = (provider: Provider) => {
  return provider.models.length;
};
const search = ref("");
const filteredProviders = computed(() => {
  if (!search.value) return providers.value;
  return providers.value.filter((p) =>
    p.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

const showAddModelModal = ref(false);
const editModelModal = ref(false);
const modelForm = ref<any>({ name: "", id: "", group: "" });
const selectedModels = ref<string[]>([]);

function toast(msg: string) {
  window.alert(msg); // 可替换为更优雅的全局toast
}

async function loadProviders() {
  loading.value = true;
  providers.value = await databaseService.getAllProviders();
  loading.value = false;
  // 保持选中
  if (selectedProvider.value) {
    const updated = providers.value.find(
      (p) => p.id === selectedProvider.value!.id
    );
    if (updated) selectProvider(updated);
  }
}

function selectProvider(p: Provider) {
  selectedProvider.value = p;
  editProvider.value = { ...p };
  selectedModels.value = [];
}

async function addProvider() {
  try {
    await databaseService.createProvider({
      name: newProvider.value.name,
      baseUrl: newProvider.value.url,
      apiKey: newProvider.value.apiKey,
      enabled: false,
    });
    showAdd.value = false;
    newProvider.value = {
      name: "",
      url: "",
      apiKey: "",
      description: "",
    };
    toast("新增服务成功");
    await loadProviders();
  } catch (e) {
    toast("新增服务失败");
  }
}

function resetEditProvider() {
  if (selectedProvider.value) {
    editProvider.value = { ...selectedProvider.value };
  }
}

async function saveEditProvider() {
  try {
    await databaseService.updateProvider(editProvider.value);
    toast("保存成功");
    await loadProviders();
    // 保持选中
    const updated = providers.value.find((p) => p.id === editProvider.value.id);
    if (updated) selectProvider(updated);
  } catch (e) {
    toast("保存失败");
  }
}

async function toggleProviderEnabled(provider: Provider) {
  try {
    const updatedProvider = { ...provider, enabled: !provider.enabled };
    await databaseService.updateProvider(updatedProvider);
    toast(provider.enabled ? "禁用成功" : "启用成功");
    await loadProviders();
  } catch (e) {
    toast("切换状态失败");
  }
}

async function activateProvider(p: Provider) {
  try {
    await databaseService.setActiveProvider(p.id);
    toast("激活成功");
    await loadProviders();
    // 保持选中
    const updated = providers.value.find((x) => x.id === p.id);
    if (updated) selectProvider(updated);
  } catch (e) {
    toast("激活失败");
  }
}

function confirmDeleteProvider(p: Provider) {
  if (window.confirm(`确定要删除服务 ${p.name} 吗？`)) {
    deleteProvider(p.id);
  }
}

async function deleteProvider(id: string) {
  try {
    await databaseService.deleteProvider(id);
    toast("删除成功");
    selectedProvider.value = null;
    await loadProviders();
  } catch (e) {
    toast("删除失败");
  }
}

function editModel(model: ProviderModel) {
  modelForm.value = { ...model };
  editModelModal.value = true;
  showAddModelModal.value = false;
  nextTick(() => {
    const input = document.querySelector(
      ".model-edit-modal input"
    ) as HTMLInputElement;
    if (input) input.focus();
  });
}

function closeModelModal() {
  editModelModal.value = false;
  showAddModelModal.value = false;
  modelForm.value = {
    name: "",
    id: "",
    group: "",
  };
}

async function addModel() {
  try {
    if (!selectedProvider.value) return;
    await databaseService.addModelToProvider(selectedProvider.value.id, {
      id: modelForm.value.id,
      name: modelForm.value.name,
      group: modelForm.value.group,
      enabled: true,
    });
    toast("新增模型成功");
    closeModelModal();
    await loadProviders();
  } catch (e) {
    toast("新增模型失败");
  }
}

async function saveEditModel() {
  try {
    if (!selectedProvider.value) return;
    await databaseService.updateProviderModel(
      selectedProvider.value.id,
      modelForm.value.id,
      modelForm.value
    );
    toast("保存模型成功");
    closeModelModal();
    await loadProviders();
  } catch (e) {
    toast("保存模型失败");
  }
}

function confirmDeleteModel(model: ProviderModel) {
  if (window.confirm(`确定要删除模型 ${model.name} 吗？`)) {
    deleteModel(model.id);
  }
}

async function deleteModel(id: string) {
  try {
    if (!selectedProvider.value) return;
    await databaseService.deleteProviderModel(selectedProvider.value.id, id);
    toast("删除模型成功");
    await loadProviders();
  } catch (e) {
    toast("删除模型失败");
  }
}

async function activateModel(model: ProviderModel) {
  try {
    if (!selectedProvider.value) return;
    await databaseService.setActiveModel(selectedProvider.value.id, model.id);
    toast("激活模型成功");
    await loadProviders();
  } catch (e) {
    toast("激活模型失败");
  }
}

async function deactivateModel(model: ProviderModel) {
  try {
    if (!selectedProvider.value) return;
    await databaseService.updateProviderModel(
      selectedProvider.value.id,
      model.id,
      { enabled: false }
    );
    toast("禁用模型成功");
    await loadProviders();
  } catch (e) {
    toast("禁用模型失败");
  }
}

function moveModel(idx: number, dir: number) {
  // 这里只做前端顺序调整，实际排序可扩展为数据库字段
  const arr = modelsOfProvider.value.slice();
  if (idx + dir < 0 || idx + dir >= arr.length) return;
  const temp = arr[idx];
  arr[idx] = arr[idx + dir];
  arr[idx + dir] = temp;
  // TODO: 可将排序结果同步到数据库
}

function batchDeleteModels() {
  if (!selectedModels.value.length) return;
  if (
    window.confirm(
      `确定要批量删除选中的 ${selectedModels.value.length} 个模型吗？`
    )
  ) {
    selectedModels.value.forEach((id) => deleteModel(id));
    selectedModels.value = [];
  }
}

onMounted(loadProviders);
</script>
