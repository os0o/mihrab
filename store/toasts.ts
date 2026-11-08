import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  action?: { label: string; run: () => void };
  // التنبيهات المهمة (الأذان) تبقى حتى يغلقها المستخدم
  sticky?: boolean;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id"> & { id?: string }) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastStore>()((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = t.id ?? Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts.filter((x) => x.id !== id), { ...t, id }] }));
    if (!t.sticky) setTimeout(() => get().dismiss(id), 6000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (t: Omit<Toast, "id"> & { id?: string }) => useToasts.getState().push(t);
