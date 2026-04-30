import { create } from 'zustand'
import type { ViewMode, SortField, SortOrder, FileInfo } from '../types/file'

interface BrowserState {
  currentPath: string
  selectedPaths: string[]
  activeFile: FileInfo | null
  viewMode: ViewMode
  sortField: SortField
  sortOrder: SortOrder
  showPreview: boolean
  previewPath: string
  showSecondPanel: boolean
  secondPanelPath: string
  setCurrentPath: (path: string) => void
  setSelectedPaths: (paths: string[]) => void
  toggleSelectPath: (path: string) => void
  setActiveFile: (file: FileInfo | null) => void
  setViewMode: (mode: ViewMode) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  setShowPreview: (show: boolean, path?: string) => void
  toggleSecondPanel: () => void
  setSecondPanelPath: (path: string) => void
  clearSelection: () => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  currentPath: '',
  selectedPaths: [],
  activeFile: null,
  viewMode: 'table',
  sortField: 'name',
  sortOrder: 'asc',
  showPreview: false,
  previewPath: '',
  showSecondPanel: false,
  secondPanelPath: '',
  setCurrentPath: (path) => set({ currentPath: path, selectedPaths: [], activeFile: null }),
  setSelectedPaths: (paths) => set({ selectedPaths: paths }),
  toggleSelectPath: (path) =>
    set((s) => ({
      selectedPaths: s.selectedPaths.includes(path)
        ? s.selectedPaths.filter((p) => p !== path)
        : [...s.selectedPaths, path],
    })),
  setActiveFile: (file) => set({ activeFile: file, selectedPaths: [] }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () => set((s) => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),
  setShowPreview: (show, path) => set({ showPreview: show, previewPath: path || '' }),
  toggleSecondPanel: () => set((s) => ({ showSecondPanel: !s.showSecondPanel, secondPanelPath: s.secondPanelPath || s.currentPath })),
  setSecondPanelPath: (path) => set({ secondPanelPath: path }),
  clearSelection: () => set({ selectedPaths: [], activeFile: null }),
}))
