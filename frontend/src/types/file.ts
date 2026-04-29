export interface FileInfo {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified_at: string
  created_at: string
  extension: string
  mime_type: string
}

export interface FileListResponse {
  files: FileInfo[]
  total: number
  page: number
  page_size: number
}

export interface BatchOperationResponse {
  operation_id: string
  results: { source: string; dest: string; success: boolean; error?: string }[]
  undo_available_until: string
}

export type ViewMode = 'table' | 'grid'
export type SortField = 'name' | 'date' | 'size' | 'type'
export type SortOrder = 'asc' | 'desc'
