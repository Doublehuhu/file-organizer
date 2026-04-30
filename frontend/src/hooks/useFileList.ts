import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useBrowserStore } from '../stores/browserStore'
import type { FileListResponse } from '../types/file'

export function useFileList(path: string, page = 1, pageSize = 100, sort = 'name', order = 'asc') {
  const refreshKey = useBrowserStore((s) => s.refreshKey)
  return useQuery<FileListResponse>({
    queryKey: ['fileList', path, page, pageSize, sort, order, refreshKey],
    queryFn: async () => {
      if (!path) return { files: [], total: 0, page: 1, page_size: pageSize }
      const { data } = await api.get('/api/files/list', { params: { path, page, page_size: pageSize, sort, order } })
      return data
    },
    enabled: !!path,
    placeholderData: (prev) => prev,
  })
}

export function useFileInfo(path: string) {
  return useQuery({
    queryKey: ['fileInfo', path],
    queryFn: async () => {
      const { data } = await api.get('/api/files/info', { params: { path } })
      return data
    },
    enabled: !!path,
  })
}

export function usePreviewContent(path: string) {
  return useQuery({
    queryKey: ['preview', path],
    queryFn: async () => {
      const { data } = await api.get('/api/preview/content', { params: { path } })
      return data
    },
    enabled: !!path,
  })
}
