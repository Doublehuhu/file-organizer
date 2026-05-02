import { useEffect, useRef, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Modal, message } from 'antd'
import { useBrowserStore } from '../../stores/browserStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useOperationStore } from '../../stores/operationStore'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import Header from './Header'
import FileTable from '../file-browser/FileTable'
import FileGrid from '../file-browser/FileGrid'
import MoveCopyDialog from '../file-browser/MoveCopyDialog'
import VoiceControl from '../common/VoiceControl'
import SettingsDialog from '../common/SettingsDialog'
import PreviewPanel from '../file-preview/PreviewPanel'
import { useFileList } from '../../hooks/useFileList'
import api from '../../api/client'

function FilePanel({ panelPath, isSecond }: { panelPath: string; isSecond?: boolean }) {
  const viewMode = useBrowserStore((s) => s.viewMode)
  const sortField = useBrowserStore((s) => s.sortField)
  const sortOrder = useBrowserStore((s) => s.sortOrder)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const setSecondPanelPath = useBrowserStore((s) => s.setSecondPanelPath)
  const { data, isLoading, error } = useFileList(panelPath, 1, 100, sortField, sortOrder)
  return (
    <div className="app-main" style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header panelPath={panelPath} onNavigate={isSecond ? setSecondPanelPath : setCurrentPath} />
      <div className="app-content">
        {isLoading && <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>}
        {error && <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>加载失败</div>}
        {data && viewMode === 'table' && <FileTable files={data.files} />}
        {data && viewMode === 'grid' && <FileGrid files={data.files} />}
        {data && data.files.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>此目录为空</div>}
      </div>
    </div>
  )
}

export default function AppLayout() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const activeFile = useBrowserStore((s) => s.activeFile)
  const setActiveFile = useBrowserStore((s) => s.setActiveFile)
  const showPreview = useBrowserStore((s) => s.showPreview)
  const previewPath = useBrowserStore((s) => s.previewPath)
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const showSecondPanel = useBrowserStore((s) => s.showSecondPanel)
  const secondPanelPath = useBrowserStore((s) => s.secondPanelPath)
  const panelWidths = useSettingsStore((s) => s.panelWidths)
  const setPanelWidths = useSettingsStore((s) => s.setPanelWidths)
  const setOperation = useOperationStore((s) => s.setOperation)
  const triggerRefresh = useBrowserStore((s) => s.triggerRefresh)

  const [voiceActive, setVoiceActive] = useState(false)
  const [moveCopyOpen, setMoveCopyOpen] = useState(false)
  const [moveCopyType, setMoveCopyType] = useState<'move' | 'copy'>('move')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'center' | 'preview' | null>(null)

  useEffect(() => {
    const pp = searchParams.get('path')
    if (pp) setCurrentPath(pp)
    else setCurrentPath('/Users/yizheng/Desktop')
  }, [])
  useEffect(() => { if (currentPath) setSearchParams({ path: currentPath }) }, [currentPath])

  const onMouseDown = useCallback((panel: 'center' | 'preview') => (e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = panel
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
  }, [])
  useEffect(() => {
    const mm = () => {}
    const mu = () => { dragging.current = null; document.body.style.cursor = ''; document.body.style.userSelect = '' }
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu)
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu) }
  }, [])

  const focusRename = () => { document.getElementById('rename-input')?.focus() }

  const handleDelete = () => {
    if (!activeFile) return
    Modal.confirm({
      title: '确认删除', content: `删除 "${activeFile.name}"？可撤销。`, okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        const { data } = await api.post('/api/files/delete', { paths: [activeFile.path], permanent: false })
        setOperation({ operation_id: data.operation_id, message: `已删除 ${activeFile.name}`, undo_available_until: data.undo_available_until })
        triggerRefresh(); setActiveFile(null)
      },
    })
  }

  const handleNewFolder = async () => {
    if (!currentPath) return
    try { await api.post('/api/files/create-folder', { parent_path: currentPath, folder_name: '新建文件夹' }); triggerRefresh() } catch {}
  }

  const handleAddFavorite = async () => {
    if (!currentPath) return
    try { await api.post('/api/files/favorites', { path: currentPath }); message.success('已收藏') } catch {}
  }

  const handleVoiceCommand = useCallback(async (cmd: string, param?: string) => {
    if (!activeFile && !['navigate', 'newfolder', 'favorite', 'refresh'].includes(cmd)) { message.warning('请先选中文件'); return }
    switch (cmd) {
      case 'rename': param ? (await api.post('/api/files/rename', { path: activeFile!.path, new_name: param }), triggerRefresh(), setActiveFile(null), message.success(`已重命名: ${param}`)) : focusRename(); break
      case 'move': setMoveCopyType('move'); setMoveCopyOpen(true); break
      case 'copy': setMoveCopyType('copy'); setMoveCopyOpen(true); break
      case 'delete': handleDelete(); break
      case 'preview': setShowPreview(true, activeFile!.path); break
      case 'newfolder': handleNewFolder(); break
      case 'favorite': handleAddFavorite(); break
      case 'navigate': param && setCurrentPath(param); break
      case 'refresh': triggerRefresh(); break
    }
  }, [activeFile, currentPath])

  return (
    <div className="app-layout">
      <Toolbar activeFile={activeFile} onRename={focusRename}
        onMove={() => { setMoveCopyType('move'); setMoveCopyOpen(true) }}
        onCopy={() => { setMoveCopyType('copy'); setMoveCopyOpen(true) }}
        onPreview={() => activeFile && setShowPreview(true, activeFile.path)}
        onDelete={handleDelete} onNewFolder={handleNewFolder} onAddFavorite={handleAddFavorite}
        onToggleVoice={() => setVoiceActive(!voiceActive)} onOpenSettings={() => setSettingsOpen(true)} voiceActive={voiceActive} />
      <div className="app-body" ref={containerRef}>
        <Sidebar />
        <div className="resize-handle" onMouseDown={onMouseDown('center')} />
        {showSecondPanel ? (
          <><FilePanel panelPath={currentPath} /><div className="resize-handle" onMouseDown={onMouseDown('center')} /><FilePanel panelPath={secondPanelPath || currentPath} isSecond /></>
        ) : <FilePanel panelPath={currentPath} />}
        {showPreview && (
          <><div className="resize-handle" onMouseDown={onMouseDown('preview')} /><div className="preview-panel" style={{ width: panelWidths.preview || 420, flex: 'none' }}><PreviewPanel path={previewPath} onClose={() => setShowPreview(false)} /></div></>
        )}
      </div>
      {activeFile && (
        <div style={{ padding: '6px 16px', background: '#e6f4ff', borderTop: '1px solid #91caff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>📄 {activeFile.name}</span>
          <span style={{ color: '#666' }}>已选中 — 使用顶部工具栏或语音控制 (🎤)</span>
        </div>
      )}
      <VoiceControl active={voiceActive} onCommand={handleVoiceCommand} onToggle={() => setVoiceActive(false)} />
      <MoveCopyDialog open={moveCopyOpen} type={moveCopyType} sourcePaths={activeFile ? [activeFile.path] : []} onClose={() => setMoveCopyOpen(false)} onDone={() => { setMoveCopyOpen(false); triggerRefresh(); setActiveFile(null) }} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
