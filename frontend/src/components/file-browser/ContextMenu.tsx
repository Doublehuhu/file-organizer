import { useState } from 'react'
import { Dropdown, Modal, Input, message } from 'antd'
import type { MenuProps } from 'antd'
import { EyeOutlined, EditOutlined, SwapOutlined, CopyOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'
import MoveCopyDialog from './MoveCopyDialog'
import type { FileInfo } from '../../types/file'
import api from '../../api/client'

interface Props {
  file: FileInfo | undefined
  children: React.ReactNode
}

export default function ContextMenu({ file, children }: Props) {
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const setOperation = useOperationStore((s) => s.setOperation)
  const [moveCopyOpen, setMoveCopyOpen] = useState(false)
  const [moveCopyType, setMoveCopyType] = useState<'move' | 'copy'>('move')
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')

  if (!file) return <>{children}</>

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${file.name}" 吗？文件将移入回收站，30分钟内可撤销。`,
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const { data } = await api.post('/api/files/delete', { paths: [file.path], permanent: false })
          setOperation({ operation_id: data.operation_id, message: `已删除 ${file.name}`, undo_available_until: data.undo_available_until })
          message.success(`已删除 ${file.name}`)
        } catch (e: any) { message.error(`删除失败: ${e.message}`) }
      },
    })
  }

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) { setRenameOpen(false); return }
    try {
      await api.post('/api/files/rename', { path: file.path, new_name: newName })
      message.success(`已重命名为 ${newName}`)
    } catch (e: any) { message.error(`重命名失败: ${e.message}`) }
    setRenameOpen(false)
  }

  const menuItems: MenuProps['items'] = [
    { key: 'preview', icon: <EyeOutlined />, label: '预览', onClick: () => setShowPreview(true, file.path) },
    { type: 'divider' },
    { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: () => { setNewName(file.name); setRenameOpen(true) } },
    { key: 'ai-rename', icon: <RobotOutlined />, label: 'AI 重命名' },
    { type: 'divider' },
    { key: 'move', icon: <SwapOutlined />, label: '移动到...', onClick: () => { setMoveCopyType('move'); setMoveCopyOpen(true) } },
    { key: 'copy', icon: <CopyOutlined />, label: '复制到...', onClick: () => { setMoveCopyType('copy'); setMoveCopyOpen(true) } },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: handleDelete },
  ]

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        {children}
      </Dropdown>
      <MoveCopyDialog
        open={moveCopyOpen} type={moveCopyType} sourcePaths={[file.path]}
        onClose={() => setMoveCopyOpen(false)} onDone={() => setMoveCopyOpen(false)}
      />
      <Modal title="重命名" open={renameOpen} onOk={handleRename} onCancel={() => setRenameOpen(false)} okText="确定" cancelText="取消">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} onPressEnter={handleRename} autoFocus />
      </Modal>
    </>
  )
}
