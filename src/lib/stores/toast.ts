import { writable } from "svelte/store";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title?: string;
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(toast: Omit<Toast, "id">) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    update((toasts) => [...toasts, newToast]);

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        remove(id);
      }, newToast.duration);
    }

    return id;
  }

  function remove(id: string) {
    update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  function clear() {
    update(() => []);
  }

  // Convenience methods
  function success(message: string, title?: string, duration?: number) {
    return add({ type: "success", message, title, duration });
  }

  function error(message: string, title?: string, duration?: number) {
    return add({ type: "error", message, title, duration });
  }

  function info(message: string, title?: string, duration?: number) {
    return add({ type: "info", message, title, duration });
  }

  return {
    subscribe,
    add,
    remove,
    clear,
    success,
    error,
    info,
  };
}

export const toastStore = createToastStore();
