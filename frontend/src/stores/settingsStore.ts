import { create } from 'zustand'

interface SettingsState {
  allowedDirectories: string[]
  confirmBeforeDelete: boolean
  apiKey: string
  setAllowedDirectories: (dirs: string[]) => void
  setConfirmBeforeDelete: (v: boolean) => void
  setApiKey: (key: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  allowedDirectories: [],
  confirmBeforeDelete: true,
  apiKey: '',
  setAllowedDirectories: (dirs) => set({ allowedDirectories: dirs }),
  setConfirmBeforeDelete: (v) => set({ confirmBeforeDelete: v }),
  setApiKey: (key) => set({ apiKey: key }),
}))
