export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function formatDate(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
    ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function getFileTypeIcon(ext: string, isDir: boolean): string {
  if (isDir) return 'folder'
  const map: Record<string, string> = {
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image', '.svg': 'image',
    '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.mkv': 'video', '.webm': 'video',
    '.mp3': 'audio', '.wav': 'audio', '.flac': 'audio', '.aac': 'audio',
    '.pdf': 'pdf', '.doc': 'doc', '.docx': 'doc', '.ppt': 'ppt', '.pptx': 'ppt',
    '.xls': 'excel', '.xlsx': 'excel', '.csv': 'excel',
    '.txt': 'txt', '.md': 'txt', '.json': 'code', '.xml': 'code',
    '.zip': 'zip', '.rar': 'zip', '.7z': 'zip', '.tar': 'zip', '.gz': 'zip',
  }
  return map[ext.toLowerCase()] || 'file'
}
