import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Space, Typography, Modal, message } from 'antd'
import { SwapOutlined, CopyOutlined, DeleteOutlined, EyeOutlined, EnterOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'
import MoveCopyDialog from './MoveCopyDialog'
import type { FileInfo } from '../../types/file'
import api from '../../api/client'

const { Text } = Typography

function splitExt(name: string): [string, string] {
  const i = name.lastIndexOf('.')
  if (i <= 0) return [name, '']
  return [name.slice(0, i), name.slice(i)]
}

interface Props { file: FileInfo }

export default function FileActionBar({ file }: Props) {
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const setActiveFile = useBrowserStore((s) => s.setActiveFile)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const triggerRefresh = useBrowserStore((s) => s.triggerRefresh)
  const setOperation = useOperationStore((s) => s.setOperation)
  const [stem, ext] = splitExt(file.name)
  const [newStem, setNewStem] = useState(stem)
  const [loading, setLoading] = useState(false)
  const [moveCopyOpen, setMoveCopyOpen] = useState(false)
  const [moveCopyType, setMoveCopyType] = useState<'move' | 'copy'>('move')

  useEffect(() => { const [s] = splitExt(file.name); setNewStem(s) }, [file])

  const newFullName = file.is_dir ? newStem : newStem + ext

  const handleRename = async () => {
    if (!newStem.trim() || newFullName === file.name) return
    setLoading(true)
    try {
      await api.post('/api/files/rename', { path: file.path, new_name: newFullName })
      message.success(`已重命名: ${newFullName}`)
      triggerRefresh()
      setActiveFile(null)
    } catch (e: any) { message.error(`失败: ${e.message}`) }
    setLoading(false)
  }

  const doDelete = useCallback(() => {
    Modal.confirm({
      title: '确认删除', content: `删除 "${file.name}"？可撤销。`, okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        const { data } = await api.post('/api/files/delete', { paths: [file.path], permanent: false })
        setOperation({ operation_id: data.operation_id, message: `已删除 ${file.name}`, undo_available_until: data.undo_available_until })
        triggerRefresh()
        setActiveFile(null)
      },
    })
  }, [file, setActiveFile, setOperation, triggerRefresh])

  const doMove = useCallback(() => { setMoveCopyType('move'); setMoveCopyOpen(true) }, [])
  const doCopy = useCallback(() => { setMoveCopyType('copy'); setMoveCopyOpen(true) }, [])
  const doPreview = useCallback(() => setShowPreview(true, file.path), [file.path, setShowPreview])
  const doEnter = useCallback(() => setCurrentPath(file.path), [file.path, setCurrentPath])
  const focusRename = useCallback(() => { document.getElementById('rename-input')?.focus() }, [])

  const onMoveCopyDone = () => { setMoveCopyOpen(false); triggerRefresh(); setActiveFile(null) }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'm') { e.preventDefault(); doMove() }
      if (mod && e.key === 'c') { e.preventDefault(); doCopy() }
      if (mod && e.key === 'p') { e.preventDefault(); doPreview() }
      if (mod && (e.key === 'Backspace' || e.key === 'Delete')) { e.preventDefault(); doDelete() }
      if (mod && e.key === 'r') { e.preventDefault(); focusRename() }
      if (e.key === 'Escape') { e.preventDefault(); setActiveFile(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doMove, doCopy, doPreview, doDelete, focusRename, setActiveFile])

  return (
    <>
      <div style={{ padding: '12px 16px', background: '#f6f8fa', borderTop: '2px solid #d0d7de', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Text strong style={{ fontSize: 14, minWidth: 120, maxWidth: 260 }} ellipsis={{ tooltip: file.name }}>{file.name}</Text>
        <Space size={8} wrap>
          {file.is_dir ? (
            <Input id="rename-input" value={newStem} onChange={(e) => setNewStem(e.target.value)} onPressEnter={handleRename} placeholder="输入新名称..." style={{ width: 280, fontSize: 14 }} />
          ) : (
            <Input id="rename-input" value={newStem} onChange={(e) => setNewStem(e.target.value)} onPressEnter={handleRename} placeholder="输入新名称..." style={{ width: 280, fontSize: 14 }}
              addonAfter={<Text type="secondary" style={{ fontSize: 12 }}>{ext}</Text>} />
          )}
          {newFullName !== file.name && (
            <Button type="primary" onClick={handleRename} loading={loading}>确认重命名 ⌘R</Button>
          )}
          {file.is_dir && <Button icon={<EnterOutlined />} onClick={doEnter} type="primary">进入文件夹</Button>}
          <Button icon={<SwapOutlined />} onClick={doMove}>移动 ⌘M</Button>
          <Button icon={<CopyOutlined />} onClick={doCopy}>复制 ⌘C</Button>
          {!file.is_dir && <Button icon={<EyeOutlined />} onClick={doPreview}>预览 ⌘P</Button>}
          <Button danger icon={<DeleteOutlined />} onClick={doDelete}>删除 ⌘⌫</Button>
          <Text type="secondary" style={{ fontSize: 11 }}>Esc 取消</Text>
        </Space>
      </div>
      <MoveCopyDialog open={moveCopyOpen} type={moveCopyType} sourcePaths={[file.path]} onClose={() => setMoveCopyOpen(false)} onDone={onMoveCopyDone} />
    </>
  )
}
