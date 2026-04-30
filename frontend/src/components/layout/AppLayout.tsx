import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBrowserStore } from '../../stores/browserStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Sidebar from './Sidebar'
import Header from './Header'
import FileTable from '../file-browser/FileTable'
import FileGrid from '../file-browser/FileGrid'
import BatchActionsBar from '../file-browser/BatchActionsBar'
import FileActionBar from '../file-browser/FileActionBar'
import PreviewPanel from '../file-preview/PreviewPanel'
import { useFileList } from '../../hooks/useFileList'

function FilePanel({ panelPath, isSecond }: { panelPath: string; isSecond?: boolean }) {
  const viewMode = useBrowserStore((s) => s.viewMode)
  const sortField = useBrowserStore((s) => s.sortField)
  const sortOrder = useBrowserStore((s) => s.sortOrder)
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const activeFile = useBrowserStore((s) => s.activeFile)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const setSecondPanelPath = useBrowserStore((s) => s.setSecondPanelPath)
  const { data, isLoading, error } = useFileList(panelPath, 1, 100, sortField, sortOrder)

  return (
    <div className="app-main" style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header panelPath={panelPath} onNavigate={isSecond ? setSecondPanelPath : setCurrentPath} />
      {selectedPaths.length > 1 && <BatchActionsBar />}
      <div className="app-content">
        {isLoading && <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>}
        {error && <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>加载失败: {String(error)}</div>}
        {data && viewMode === 'table' && <FileTable files={data.files} />}
        {data && viewMode === 'grid' && <FileGrid files={data.files} />}
        {data && data.files.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>此目录为空</div>}
      </div>
      {activeFile && <FileActionBar file={activeFile} />}
    </div>
  )
}

export default function AppLayout() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const showPreview = useBrowserStore((s) => s.showPreview)
  const previewPath = useBrowserStore((s) => s.previewPath)
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const showSecondPanel = useBrowserStore((s) => s.showSecondPanel)
  const secondPanelPath = useBrowserStore((s) => s.secondPanelPath)
  const panelWidths = useSettingsStore((s) => s.panelWidths)
  const setPanelWidths = useSettingsStore((s) => s.setPanelWidths)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'sidebar' | 'center' | 'preview' | null>(null)

  useEffect(() => {
    const pp = searchParams.get('path')
    if (pp && pp !== currentPath) setCurrentPath(pp)
  }, [])

  useEffect(() => {
    if (currentPath) setSearchParams({ path: currentPath })
  }, [currentPath])

  const onMouseDown = useCallback((panel: 'sidebar' | 'center' | 'preview') => (e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = panel
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const mm = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const x = e.clientX - r.left
      if (dragging.current === 'sidebar') {
        const w = Math.max(160, Math.min(400, x))
        setPanelWidths({ ...panelWidths, sidebar: w })
      }
    }
    const mu = () => { dragging.current = null; document.body.style.cursor = ''; document.body.style.userSelect = '' }
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu)
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu) }
  }, [panelWidths, setPanelWidths])

  return (
    <div className="app-layout">
      <div className="app-body" ref={containerRef}>
        <div className="app-sidebar" style={{ width: panelWidths.sidebar, minWidth: panelWidths.sidebar, flex: 'none' }}>
          <Sidebar />
        </div>
        <div className="resize-handle" onMouseDown={onMouseDown('sidebar')} />

        {showSecondPanel ? (
          <>
            <FilePanel panelPath={currentPath} />
            <div className="resize-handle" onMouseDown={onMouseDown('center')} />
            <FilePanel panelPath={secondPanelPath || currentPath} isSecond />
          </>
        ) : (
          <FilePanel panelPath={currentPath} />
        )}

        {showPreview && (
          <>
            <div className="resize-handle" onMouseDown={onMouseDown('preview')} />
            <div className="preview-panel" style={{ width: panelWidths.preview || 420, flex: 'none' }}>
              <PreviewPanel path={previewPath} onClose={() => setShowPreview(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
