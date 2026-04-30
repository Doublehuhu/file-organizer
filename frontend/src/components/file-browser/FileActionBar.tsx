import { useState } from 'react'
import { Button, Input, Space, Typography, Modal, message } from 'antd'
import { SwapOutlined, CopyOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'
import MoveCopyDialog from './MoveCopyDialog'
import type { FileInfo } from '../../types/file'
import api from '../../api/client'

const { Text } = Typography

interface Props { file: FileInfo }

export default function FileActionBar({ file }: Props) {
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const setActiveFile = useBrowserStore((s) => s.setActiveFile)
  const setOperation = useOperationStore((s) => s.setOperation)
  const [newName, setNewName] = useState(file.name)
  const [loading, setLoading] = useState(false)
  const [moveCopyOpen, setMoveCopyOpen] = useState(false)
  const [moveCopyType, setMoveCopyType] = useState<'move' | 'copy'>('move')

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) return
    setLoading(true)
    try {
      await api.post('/api/files/rename', { path: file.path, new_name: newName })
      message.success(`已重命名: ${newName}`)
      setActiveFile(null)
    } catch (e: any) { message.error(`重命名失败: ${e.message}`) }
    setLoading(false)
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除', content: `删除 "${file.name}"？可撤销。`, okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        const { data } = await api.post('/api/files/delete', { paths: [file.path], permanent: false })
        setOperation({ operation_id: data.operation_id, message: `已删除 ${file.name}`, undo_available_until: data.undo_available_until })
        setActiveFile(null)
      },
    })
  }

  return (
    <>
      <div style={{ padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Text strong style={{ minWidth: 100 }} ellipsis={{ tooltip: file.name }}>{file.name}</Text>
        <Space size={4}>
          <Input size="small" value={newName} onChange={(e) => setNewName(e.target.value)} onPressEnter={handleRename} placeholder="新名称..." style={{ width: 260 }} />
          {newName !== file.name && <Button type="primary" size="small" onClick={handleRename} loading={loading}>确认重命名</Button>}
          <Button size="small" icon={<SwapOutlined />} onClick={() => { setMoveCopyType('move'); setMoveCopyOpen(true) }}>移动</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => { setMoveCopyType('copy'); setMoveCopyOpen(true) }}>复制</Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setShowPreview(true, file.path)}>预览</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
        </Space>
      </div>
      <MoveCopyDialog open={moveCopyOpen} type={moveCopyType} sourcePaths={[file.path]} onClose={() => setMoveCopyOpen(false)} onDone={() => { setMoveCopyOpen(false); setActiveFile(null) }} />
    </>
  )
}
