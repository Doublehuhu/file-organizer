import { create } from 'zustand'

interface PanelWidths {
  sidebar: number
  main: number
  preview: number
}

interface SettingsState {
  allowedDirectories: string[]
  confirmBeforeDelete: boolean
  apiKey: string
  panelWidths: PanelWidths
  setAllowedDirectories: (dirs: string[]) => void
  setConfirmBeforeDelete: (v: boolean) => void
  setApiKey: (key: string) => void
  setPanelWidths: (widths: PanelWidths) => void
}

function loadPanelWidths(): PanelWidths {
  try {
    const saved = localStorage.getItem('panelWidths')
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return { sidebar: 240, main: 400, preview: 0 }
}

function savePanelWidths(widths: PanelWidths) {
  try {
    localStorage.setItem('panelWidths', JSON.stringify(widths))
  } catch { /* ignore */ }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  allowedDirectories: [],
  confirmBeforeDelete: true,
  apiKey: '',
  panelWidths: loadPanelWidths(),
  setAllowedDirectories: (dirs) => set({ allowedDirectories: dirs }),
  setConfirmBeforeDelete: (v) => set({ confirmBeforeDelete: v }),
  setApiKey: (key) => set({ apiKey: key }),
  setPanelWidths: (widths) => {
    savePanelWidths(widths)
    set({ panelWidths: widths })
  },
}))
