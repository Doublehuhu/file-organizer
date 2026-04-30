import { useState, useEffect } from 'react'
import { Modal, Button, List, Typography, Breadcrumb, message, Space } from 'antd'
import { FolderOutlined, DesktopOutlined, HomeOutlined } from '@ant-design/icons'
import api from '../../api/client'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'

const { Text } = Typography

interface Props {
  open: boolean; type: 'move' | 'copy'; sourcePaths: string[]
  onClose: () => void; onDone: () => void
}

const QUICK = [
  { label: '桌面', path: '/Users/yizheng/Desktop', icon: <DesktopOutlined /> },
  { label: '文稿', path: '/Users/yizheng/Documents', icon: <FolderOutlined /> },
  { label: '下载', path: '/Users/yizheng/Downloads', icon: <FolderOutlined /> },
  { label: '个人', path: '/Users/yizheng', icon: <HomeOutlined /> },
]

export default function MoveCopyDialog({ open, type, sourcePaths, onClose, onDone }: Props) {
  const [dir, setDir] = useState('')
  const [folders, setFolders] = useState<{ name: string; path: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const setOp = useOperationStore((s) => s.setOperation)

  useEffect(() => {
    if (open) setDir(useBrowserStore.getState().currentPath || '/Users/yizheng')
  }, [open])

  useEffect(() => { if (dir) load(dir) }, [dir])

  const load = async (d: string) => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/files/list', { params: { path: d, page: 1, page_size: 200, sort: 'name', order: 'asc' } })
      setFolders(data.files.filter((f: any) => f.is_dir && !f.name.startsWith('.')).map((f: any) => ({ name: f.name, path: f.path })))
    } catch { setFolders([]) }
    setLoading(false)
  }

  const parts = dir.split('/').filter(Boolean)
  const bc = [
    { title: <HomeOutlined onClick={() => setDir('/Users/yizheng')} style={{ cursor: 'pointer' }} /> },
    ...parts.map((p: string, i: number) => ({
      title: <span style={{ cursor: 'pointer' }} onClick={() => setDir('/' + parts.slice(0, i + 1).join('/'))}>{p}</span>,
    })),
  ]

  const handleOk = async () => {
    if (!dir) return message.warning('请选择目标文件夹')
    setSaving(true)
    try {
      const ep = type === 'move' ? '/api/files/move' : '/api/files/copy'
      const act = type === 'move' ? '移动' : '复制'
      const { data } = await api.post(ep, { source_paths: sourcePaths, destination_dir: dir })
      const ok = data.results.filter((r: any) => r.success).length
      setOp({ operation_id: data.operation_id, message: `已${act} ${ok} 个文件`, undo_available_until: data.undo_available_until })
      message.success(`${act}成功: ${ok} 个文件`)
      onDone()
    } catch (e: any) { message.error(`失败: ${e.message}`) }
    setSaving(false)
  }

  return (
    <Modal title={`${type === 'move' ? '移动' : '复制'} ${sourcePaths.length} 个文件`} open={open} onOk={handleOk} onCancel={onClose} confirmLoading={saving} okText={type === 'move' ? '移动' : '复制'} width={560}>
      <Space wrap style={{ marginBottom: 8 }}>
        {QUICK.map((q) => <Button key={q.path} size="small" icon={q.icon} type={dir === q.path ? 'primary' : 'default'} onClick={() => setDir(q.path)}>{q.label}</Button>)}
      </Space>
      <Breadcrumb items={bc} style={{ marginBottom: 8 }} />
      <Text type="secondary">目标: <Text code>{dir}</Text></Text>
      <List loading={loading} size="small" style={{ marginTop: 8, maxHeight: 320, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }} bordered
        dataSource={folders} locale={{ emptyText: '无子文件夹' }}
        renderItem={(f) => (
          <List.Item onClick={() => setDir(f.path)} style={{ cursor: 'pointer', background: f.path === dir ? '#e6f4ff' : undefined }}>
            <FolderOutlined style={{ color: '#faad14', marginRight: 8 }} />{f.name}
          </List.Item>
        )}
      />
    </Modal>
  )
}
