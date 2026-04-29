import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBrowserStore } from '../../stores/browserStore'
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

  const { data, isLoading, error } = useFileList(currentPath, 1, 100, sortField, sortOrder)

  return (
    <div className="app-layout">
      <div className="app-body">
        <Sidebar />
        <div className="app-main">
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
        {showPreview && <PreviewPanel path={previewPath} onClose={() => setShowPreview(false)} />}
      </div>
    </div>
  )
}
