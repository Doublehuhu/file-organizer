import { useState } from 'react'
import { Modal, Button, Typography, Space, message, Alert, Input } from 'antd'
import { PlayCircleOutlined, ApartmentOutlined, FolderAddOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import api from '../../api/client'

const { Text } = Typography

interface Props { open: boolean; onClose: () => void }

export default function AutoOrganizeDialog({ open, onClose }: Props) {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const triggerRefresh = useBrowserStore((s) => s.triggerRefresh)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')

  const handleOrganize = async (dryRun: boolean) => {
    setLoading(true); setResult(null); setError('')
    try {
      const { data } = await api.post('/api/organize/run-skill', null, {
        params: { source_dir: currentPath, dry_run: dryRun },
      })
      setResult(data.output || '')
      if (!data.success && data.error) setError(data.error)
      if (!dryRun && data.success) triggerRefresh()
    } catch (e: any) { setError(e.message || '失败') }
    setLoading(false)
  }

  const createFolder = async () => {
    if (!folderName.trim()) return
    try {
      await api.post('/api/files/create-folder', { parent_path: currentPath, folder_name: folderName })
      message.success(`已创建: ${folderName}`); setFolderName(''); triggerRefresh()
    } catch (e: any) { message.error(`失败: ${e.message}`) }
  }

  return (
    <Modal title={<><ApartmentOutlined /> 自动整理</>} open={open} onCancel={onClose} width={600}
      footer={<Button onClick={onClose}>关闭</Button>}>
      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="先建文件夹 → 再一键整理"
        description="创建分类文件夹（如：课件、作业），点击「开始整理」，系统自动将文件按名称匹配到对应文件夹。" />
      <Text>当前目录: </Text><Text code>{currentPath}</Text>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Text strong><FolderAddOutlined /> 快速创建文件夹</Text>
        <Space style={{ marginTop: 8 }}>
          <Input placeholder="文件夹名（如：课件）" value={folderName} onChange={e => setFolderName(e.target.value)}
            onPressEnter={createFolder} style={{ width: 200 }} />
          <Button icon={<FolderAddOutlined />} onClick={createFolder}>创建</Button>
        </Space>
      </div>
      <Space>
        <Button icon={<PlayCircleOutlined />} onClick={() => handleOrganize(true)} loading={loading}>预览</Button>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleOrganize(false)} loading={loading}>开始整理</Button>
      </Space>
      {error && <Alert type="error" message={error} style={{ marginTop: 12 }} showIcon />}
      {result && <pre style={{ marginTop: 12, padding: 12, background: '#1e1e1e', color: '#d4d4d4', borderRadius: 6, fontSize: 13, maxHeight: 360, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{result}</pre>}
    </Modal>
  )
}
