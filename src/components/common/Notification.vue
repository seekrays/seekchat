<template>
  <!-- Toast 通知 -->
  <teleport to="body">
    <div class="notification-container">
      <transition-group name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`, { 'toast-show': toast.show }]"
        >
          <div class="toast-icon">
            <svg
              v-if="toast.type === 'success'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else-if="toast.type === 'error'"
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
              />
            </svg>
            <svg
              v-else-if="toast.type === 'warning'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div v-if="toast.message" class="toast-message">
              {{ toast.message }}
            </div>
          </div>
          <button @click="removeToast(toast.id)" class="toast-close">
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
        </div>
      </transition-group>
    </div>
  </teleport>

  <!-- 确认对话框 -->
  <teleport to="body">
    <div v-if="confirmDialog.show" class="modal-overlay" @click="cancelConfirm">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-icon">
          <svg
            v-if="confirmDialog.type === 'danger'"
            class="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <svg
            v-else
            class="w-8 h-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="confirm-content">
          <h3 class="confirm-title">{{ confirmDialog.title }}</h3>
          <p class="confirm-message">{{ confirmDialog.message }}</p>
        </div>
        <div class="confirm-actions">
          <button @click="cancelConfirm" class="btn btn-cancel">
            {{ confirmDialog.cancelText || "取消" }}
          </button>
          <button
            @click="confirmAction"
            class="btn"
            :class="
              confirmDialog.type === 'danger' ? 'btn-danger' : 'btn-primary'
            "
          >
            {{ confirmDialog.confirmText || "确定" }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";

interface Toast {
  id: number;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  show: boolean;
  duration?: number;
}

interface ConfirmDialog {
  show: boolean;
  type: "info" | "danger";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const toasts = ref<Toast[]>([]);
const confirmDialog = reactive<ConfirmDialog>({
  show: false,
  type: "info",
  title: "",
  message: "",
  confirmText: "确定",
  cancelText: "取消",
});

let toastId = 0;

// Toast 方法
const showToast = (options: {
  type: Toast["type"];
  title: string;
  message?: string;
  duration?: number;
}) => {
  const toast: Toast = {
    id: ++toastId,
    type: options.type,
    title: options.title,
    message: options.message,
    show: false,
    duration: options.duration ?? 3000,
  };

  toasts.value.push(toast);

  // 延迟显示以触发动画
  setTimeout(() => {
    toast.show = true;
  }, 50);

  // 自动移除
  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
  }

  return toast.id;
};

const removeToast = (id: number) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index > -1) {
    toasts.value[index].show = false;
    setTimeout(() => {
      toasts.value.splice(index, 1);
    }, 300);
  }
};

// 确认对话框方法
const showConfirm = (options: {
  type?: "info" | "danger";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> => {
  return new Promise((resolve) => {
    Object.assign(confirmDialog, {
      show: true,
      type: options.type || "info",
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || "确定",
      cancelText: options.cancelText || "取消",
      onConfirm: () => {
        confirmDialog.show = false;
        resolve(true);
      },
      onCancel: () => {
        confirmDialog.show = false;
        resolve(false);
      },
    });
  });
};

const confirmAction = () => {
  confirmDialog.onConfirm?.();
};

const cancelConfirm = () => {
  confirmDialog.onCancel?.();
};

// 导出方法供外部使用
defineExpose({
  success: (title: string, message?: string) =>
    showToast({ type: "success", title, message }),
  error: (title: string, message?: string) =>
    showToast({ type: "error", title, message }),
  warning: (title: string, message?: string) =>
    showToast({ type: "warning", title, message }),
  info: (title: string, message?: string) =>
    showToast({ type: "info", title, message }),
  confirm: showConfirm,
  removeToast,
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  pointer-events: auto;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
}

.toast-show {
  opacity: 1;
  transform: translateX(0);
}

.toast-success {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.toast-error {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.toast-warning {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.toast-info {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.toast-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.toast-message {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.4;
}

.toast-close {
  margin-left: 8px;
  padding: 2px;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
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
  z-index: 10000;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.confirm-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.confirm-content {
  text-align: center;
  margin-bottom: 24px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.confirm-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
