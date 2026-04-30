import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBrowserStore } from '../../stores/browserStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Sidebar from './Sidebar'
import Header from './Header'
import FileTable from '../file-browser/FileTable'
import FileGrid from '../file-browser/FileGrid'
import BatchActionsBar from '../file-browser/BatchActionsBar'
import PreviewPanel from '../file-preview/PreviewPanel'
import { useFileList } from '../../hooks/useFileList'

export default function AppLayout() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const viewMode = useBrowserStore((s) => s.viewMode)
  const sortField = useBrowserStore((s) => s.sortField)
  const sortOrder = useBrowserStore((s) => s.sortOrder)
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const showPreview = useBrowserStore((s) => s.showPreview)
  const previewPath = useBrowserStore((s) => s.previewPath)
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const panelWidths = useSettingsStore((s) => s.panelWidths)
  const setPanelWidths = useSettingsStore((s) => s.setPanelWidths)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'sidebar' | 'preview' | null>(null)

  useEffect(() => {
    const pathParam = searchParams.get('path')
    if (pathParam && pathParam !== currentPath) {
      setCurrentPath(pathParam)
    }
  }, [])

  useEffect(() => {
    if (currentPath) {
      setSearchParams({ path: currentPath })
    }
  }, [currentPath])

  const handleMouseDown = useCallback((panel: 'sidebar' | 'preview') => (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = panel
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalWidth = rect.width
      const x = e.clientX - rect.left

      if (dragging.current === 'sidebar') {
        const newSidebar = Math.max(160, Math.min(400, x))
        const delta = newSidebar - panelWidths.sidebar
        setPanelWidths({
          ...panelWidths,
          sidebar: newSidebar,
          main: Math.max(200, panelWidths.main - delta),
        })
      } else if (dragging.current === 'preview') {
        const newMain = Math.max(200, Math.min(totalWidth - 300, x - panelWidths.sidebar))
        setPanelWidths({
          ...panelWidths,
          main: newMain,
          preview: totalWidth - panelWidths.sidebar - newMain,
        })
      }
    }

    const handleMouseUp = () => {
      dragging.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [panelWidths, setPanelWidths])

  const { data, isLoading, error } = useFileList(currentPath, 1, 100, sortField, sortOrder)

  return (
    <div className="app-layout">
      <div className="app-body" ref={containerRef}>
        <div className="app-sidebar" style={{ width: panelWidths.sidebar, minWidth: panelWidths.sidebar, flex: 'none' }}>
          <Sidebar />
        </div>
        <div className="resize-handle" onMouseDown={handleMouseDown('sidebar')} />
        <div className="app-main" style={{ width: showPreview ? panelWidths.main : undefined, minWidth: 0, flex: showPreview ? 'none' : 1 }}>
          <Header />
          {selectedPaths.length > 0 && <BatchActionsBar />}
          <div className="app-content">
            {isLoading && <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>}
            {error && <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>加载失败: {String(error)}</div>}
            {data && viewMode === 'table' && <FileTable files={data.files} />}
            {data && viewMode === 'grid' && <FileGrid files={data.files} />}
            {data && data.files.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>此目录为空</div>}
          </div>
        </div>
        {showPreview && (
          <>
            <div className="resize-handle" onMouseDown={handleMouseDown('preview')} />
            <div className="preview-panel" style={{ width: panelWidths.preview || undefined, flex: panelWidths.preview ? 'none' : 1 }}>
              <PreviewPanel path={previewPath} onClose={() => setShowPreview(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
