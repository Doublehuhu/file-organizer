import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { EyeOutlined, EditOutlined, SwapOutlined, CopyOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'
import type { FileInfo } from '../../types/file'

interface Props {
  file: FileInfo | undefined
  children: React.ReactNode
}

export default function ContextMenu({ file, children }: Props) {
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const setOperation = useOperationStore((s) => s.setOperation)

  if (!file) return <>{children}</>

  const menuItems: MenuProps['items'] = [
    { key: 'preview', icon: <EyeOutlined />, label: '预览', onClick: () => setShowPreview(true, file.path) },
    { type: 'divider' },
    { key: 'rename', icon: <EditOutlined />, label: '重命名' },
    { key: 'ai-rename', icon: <RobotOutlined />, label: 'AI 重命名' },
    { type: 'divider' },
    { key: 'move', icon: <SwapOutlined />, label: '移动到...' },
    { key: 'copy', icon: <CopyOutlined />, label: '复制到...' },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
  ]

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  )
}
