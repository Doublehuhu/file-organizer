import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from 'antd'
import { ColumnWidthOutlined } from '@ant-design/icons'
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
    <div className="app-main" style={{ flex: 1, minWidth: 0 }}>
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
  const toggleSecondPanel = useBrowserStore((s) => s.toggleSecondPanel)
  const secondPanelPath = useBrowserStore((s) => s.secondPanelPath)
  const panelWidths = useSettingsStore((s) => s.panelWidths)
  const setPanelWidths = useSettingsStore((s) => s.setPanelWidths)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'sidebar' | 'panel2' | 'preview' | null>(null)

  useEffect(() => {
    const pathParam = searchParams.get('path')
    if (pathParam && pathParam !== currentPath) setCurrentPath(pathParam)
  }, [])

  useEffect(() => {
    if (currentPath) setSearchParams({ path: currentPath })
  }, [currentPath])

  const handleMouseDown = useCallback((panel: 'sidebar' | 'panel2' | 'preview') => (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = panel
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const tw = rect.width
      const x = e.clientX - rect.left
      if (dragging.current === 'sidebar') {
        const w = Math.max(160, Math.min(400, x))
        setPanelWidths({ ...panelWidths, sidebar: w, main: Math.max(200, panelWidths.main - (w - panelWidths.sidebar)) })
      }
    }
    const handleMouseUp = () => { dragging.current = null; document.body.style.cursor = ''; document.body.style.userSelect = '' }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp) }
  }, [panelWidths, setPanelWidths])

  return (
    <div className="app-layout">
      <div className="app-body" ref={containerRef}>
        <div className="app-sidebar" style={{ width: panelWidths.sidebar, minWidth: panelWidths.sidebar, flex: 'none' }}>
          <Sidebar />
        </div>
        <div className="resize-handle" onMouseDown={handleMouseDown('sidebar')} />

        <div style={{ display: 'flex', flex: showSecondPanel ? 'none' : 1, minWidth: 0, width: showSecondPanel ? '50%' : undefined, flexDirection: 'column' }}>
          <FilePanel panelPath={currentPath || searchParams.get('path') || ''} />
        </div>

        {showSecondPanel && (
          <>
            <div className="resize-handle" onMouseDown={handleMouseDown('panel2')} />
            <div style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
              <FilePanel panelPath={secondPanelPath || currentPath} isSecond />
            </div>
            <Button type="text" icon={<ColumnWidthOutlined />} onClick={toggleSecondPanel} title="关闭第二面板" style={{ alignSelf: 'center' }} />
          </>
        )}

        {!showSecondPanel && (
          <Button type="text" icon={<ColumnWidthOutlined />} onClick={toggleSecondPanel} title="打开第二面板" style={{ alignSelf: 'center', margin: '0 2px' }} />
        )}

        {showPreview && (
          <>
            <div className="resize-handle" onMouseDown={handleMouseDown('preview')} />
            <div className="preview-panel" style={{ width: panelWidths.preview || 420, flex: 'none' }}>
              <PreviewPanel path={previewPath} onClose={() => setShowPreview(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
