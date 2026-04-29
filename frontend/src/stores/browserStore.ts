import { create } from 'zustand'
import type { ViewMode, SortField, SortOrder } from '../types/file'

interface BrowserState {
  currentPath: string
  selectedPaths: string[]
  viewMode: ViewMode
  sortField: SortField
  sortOrder: SortOrder
  expandedFolders: string[]
  showPreview: boolean
  previewPath: string
  setCurrentPath: (path: string) => void
  setSelectedPaths: (paths: string[]) => void
  toggleSelectPath: (path: string) => void
  setViewMode: (mode: ViewMode) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  setShowPreview: (show: boolean, path?: string) => void
  addExpandedFolder: (path: string) => void
  removeExpandedFolder: (path: string) => void
  clearSelection: () => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  currentPath: '',
  selectedPaths: [],
  viewMode: 'table',
  sortField: 'name',
  sortOrder: 'asc',
  expandedFolders: [],
  showPreview: false,
  previewPath: '',
  setCurrentPath: (path) => set({ currentPath: path, selectedPaths: [] }),
  setSelectedPaths: (paths) => set({ selectedPaths: paths }),
  toggleSelectPath: (path) =>
    set((s) => ({
      selectedPaths: s.selectedPaths.includes(path)
        ? s.selectedPaths.filter((p) => p !== path)
        : [...s.selectedPaths, path],
    })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () => set((s) => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),
  setShowPreview: (show, path) => set({ showPreview: show, previewPath: path || '' }),
  addExpandedFolder: (path) => set((s) => ({ expandedFolders: [...s.expandedFolders, path] })),
  removeExpandedFolder: (path) => set((s) => ({ expandedFolders: s.expandedFolders.filter((p) => p !== path) })),
  clearSelection: () => set({ selectedPaths: [] }),
}))
