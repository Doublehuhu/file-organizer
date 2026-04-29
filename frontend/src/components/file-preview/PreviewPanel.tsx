import { Button, Typography, Spin, Image } from 'antd'
import { CloseOutlined, FileOutlined } from '@ant-design/icons'
import { usePreviewContent } from '../../hooks/useFileList'
import { formatFileSize } from '../../utils/format'

const { Text, Title, Paragraph } = Typography

interface Props {
  path: string
  onClose: () => void
}

export default function PreviewPanel({ path, onClose }: Props) {
  const { data, isLoading, error } = usePreviewContent(path)
  const fileName = path.split('/').pop() || ''
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const renderPreview = () => {
    if (isLoading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
    if (error) return <Text type="danger">加载失败: {String(error)}</Text>
    if (!data) return <Text type="secondary">无法预览此文件</Text>

    switch (data.type) {
      case 'image':
        return <Image src={`/api/preview/stream?path=${encodeURIComponent(path)}`} alt={fileName} style={{ maxWidth: '100%' }} />
      case 'text':
        return <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: '60vh', overflow: 'auto' }}>{data.content}</pre>
      case 'video':
        return <video controls style={{ maxWidth: '100%' }} src={`/api/preview/stream-video?path=${encodeURIComponent(path)}`} />
      case 'audio':
        return <audio controls style={{ width: '100%' }} src={`/api/preview/stream?path=${encodeURIComponent(path)}`} />
      case 'pdf':
      case 'document':
        return <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: '60vh', overflow: 'auto' }}>{data.content}</div>
      default:
        return <div style={{ textAlign: 'center', padding: 40 }}>
          <FileOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <Paragraph type="secondary">不支持预览此文件类型</Paragraph>
        </div>
    }
  }

  return (
    <div className="preview-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }} ellipsis={{ tooltip: fileName }}>{fileName}</Title>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      </div>
      {renderPreview()}
    </div>
  )
}
