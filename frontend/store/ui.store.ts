import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isSidebarCollapsed: boolean;
    isModalOpen: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setModalOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isModalOpen: false,
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
            setModalOpen: (open) => set({ isModalOpen: open }),
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
        }),
        {
            name: 'ui-storage',
        }
    )
);
