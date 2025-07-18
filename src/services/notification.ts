import { ref, type Ref } from "vue";

export interface NotificationInstance {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (options: {
    type?: "info" | "danger";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }) => Promise<boolean>;
  removeToast: (id: number) => void;
}

// 全局通知实例
const notificationInstance: Ref<NotificationInstance | null> = ref(null);

export const setNotificationInstance = (instance: NotificationInstance) => {
  notificationInstance.value = instance;
};

export const useNotification = () => {
  const instance = notificationInstance.value;

  if (!instance) {
    console.warn("通知组件未初始化");
    return {
      success: (title: string, message?: string) =>
        console.log("Success:", title, message),
      error: (title: string, message?: string) =>
        console.error("Error:", title, message),
      warning: (title: string, message?: string) =>
        console.warn("Warning:", title, message),
      info: (title: string, message?: string) =>
        console.info("Info:", title, message),
      confirm: async (options: any) => {
        console.log("Confirm:", options);
        return window.confirm(`${options.title}\n${options.message}`);
      },
      removeToast: (id: number) => console.log("Remove toast:", id),
    };
  }

  return instance;
};

// 快捷方法
export const notification = {
  success: (title: string, message?: string) => {
    const instance = useNotification();
    instance.success(title, message);
  },
  error: (title: string, message?: string) => {
    const instance = useNotification();
    instance.error(title, message);
  },
  warning: (title: string, message?: string) => {
    const instance = useNotification();
    instance.warning(title, message);
  },
  info: (title: string, message?: string) => {
    const instance = useNotification();
    instance.info(title, message);
  },
  confirm: (options: {
    type?: "info" | "danger";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }) => {
    const instance = useNotification();
    return instance.confirm(options);
  },
};
