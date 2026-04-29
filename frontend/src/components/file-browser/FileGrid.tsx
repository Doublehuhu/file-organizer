import { Checkbox } from 'antd'
import { FileOutlined, FolderOutlined, FileImageOutlined, FilePdfOutlined, FileTextOutlined, FileExcelOutlined, FilePptOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import type { FileInfo } from '../../types/file'

const iconMap: Record<string, React.ReactNode> = {
  image: <FileImageOutlined style={{ color: '#52c41a' }} />,
  pdf: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
  doc: <FileTextOutlined style={{ color: '#1677ff' }} />,
  excel: <FileExcelOutlined style={{ color: '#52c41a' }} />,
  ppt: <FilePptOutlined style={{ color: '#fa8c16' }} />,
}

function getIcon(file: FileInfo) {
  if (file.is_dir) return <FolderOutlined style={{ color: '#faad14' }} />
  const ext = file.extension.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (ext.includes(key)) return icon
  }
  return <FileOutlined />
}

interface Props {
  files: FileInfo[]
}

export default function FileGrid({ files }: Props) {
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const toggleSelect = useBrowserStore((s) => s.toggleSelectPath)
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)

  return (
    <div className="file-grid">
      {files.map((f) => (
        <div
          key={f.path}
          className={`file-grid-item ${selectedPaths.includes(f.path) ? 'selected' : ''}`}
          onClick={() => f.is_dir ? setCurrentPath(f.path) : setShowPreview(true, f.path)}
        >
          <Checkbox
            checked={selectedPaths.includes(f.path)}
            onChange={() => toggleSelect(f.path)}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: 4, left: 4 }}
          />
          <div className="icon">{getIcon(f)}</div>
          <div className="name">{f.name}</div>
        </div>
      ))}
    </div>
  )
}
