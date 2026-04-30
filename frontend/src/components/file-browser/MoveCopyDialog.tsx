import { useState, useEffect } from 'react'
import { Modal, Tree, Button, Typography, Space, Input, message } from 'antd'
import { FolderOutlined, HomeOutlined, DesktopOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import api from '../../api/client'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'

const { Text } = Typography

interface Props {
  open: boolean
  type: 'move' | 'copy'
  sourcePaths: string[]
  onClose: () => void
  onDone: () => void
}

const QUICK_DIRS = [
  { title: '桌面', key: '/Users/yizheng/Desktop', icon: <DesktopOutlined /> },
  { title: '文稿', key: '/Users/yizheng/Documents', icon: <FolderOutlined /> },
  { title: '下载', key: '/Users/yizheng/Downloads', icon: <FolderOutlined /> },
  { title: '个人目录', key: '/Users/yizheng', icon: <HomeOutlined /> },
]

export default function MoveCopyDialog({ open, type, sourcePaths, onClose, onDone }: Props) {
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [selectedDir, setSelectedDir] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setOperation = useOperationStore((s) => s.setOperation)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)

  useEffect(() => {
    if (open) {
      setSelectedDir(currentPath)
      loadChildren('/Users/yizheng')
    }
  }, [open])

  const loadChildren = async (parentPath: string): Promise<DataNode[]> => {
    try {
      const { data } = await api.get('/api/files/list', {
        params: { path: parentPath, page: 1, page_size: 200, sort: 'name', order: 'asc' },
      })
      return data.files
        .filter((f: any) => f.is_dir && !f.name.startsWith('.'))
        .map((f: any) => ({
          title: f.name,
          key: f.path,
          icon: <FolderOutlined />,
          isLeaf: false,
        }))
    } catch {
      return []
    }
  }

  const onLoadData = async (node: any): Promise<void> => {
    if (node.children) return
    const children = await loadChildren(node.key)
    setTreeData((prev) => updateTreeData(prev, node.key, children))
  }

  const updateTreeData = (list: DataNode[], key: string, children: DataNode[]): DataNode[] =>
    list.map((node) => {
      if (node.key === key) return { ...node, children }
      if (node.children) return { ...node, children: updateTreeData(node.children as DataNode[], key, children) }
      return node
    })

  const handleSelect = (keys: React.Key[]) => {
    if (keys.length > 0) setSelectedDir(keys[0] as string)
  }

  const handleOk = async () => {
    if (!selectedDir) {
      message.warning('请选择目标文件夹')
      return
    }
    setLoading(true)
    try {
      const endpoint = type === 'move' ? '/api/files/move' : '/api/files/copy'
      const actionName = type === 'move' ? '移动' : '复制'
      const { data } = await api.post(endpoint, { source_paths: sourcePaths, destination_dir: selectedDir })
      const successCount = data.results.filter((r: any) => r.success).length
      setOperation({
        operation_id: data.operation_id,
        message: `已${actionName} ${successCount} 个文件`,
        undo_available_until: data.undo_available_until,
      })
      message.success(`${actionName}成功: ${successCount} 个文件`)
      onDone()
    } catch (e: any) {
      message.error(`操作失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const initTreeData: DataNode[] = [
    {
      title: '快捷位置',
      key: '__quick__',
      selectable: false,
      children: QUICK_DIRS.map((d) => ({
        ...d,
        isLeaf: false,
      })),
    },
    {
      title: '浏览目录',
      key: '/Users/yizheng',
      icon: <HomeOutlined />,
      children: [],
    },
  ]

  return (
    <Modal
      title={`${type === 'move' ? '移动' : '复制'} ${sourcePaths.length} 个文件`}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText={type === 'move' ? '移动' : '复制'}
      width={500}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        目标文件夹: <Text code>{selectedDir || '未选择'}</Text>
      </Text>
      <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
        <Tree.DirectoryTree
          defaultExpandedKeys={['/Users/yizheng']}
          onSelect={handleSelect}
          loadData={onLoadData as any}
          treeData={treeData.length > 0 ? treeData : initTreeData}
        />
      </div>
    </Modal>
  )
}
