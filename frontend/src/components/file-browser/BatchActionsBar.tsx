import { Button, Space, Typography, Modal } from 'antd'
import { DeleteOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'
import api from '../../api/client'

const { Text } = Typography

export default function BatchActionsBar() {
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const clearSelection = useBrowserStore((s) => s.clearSelection)
  const setOperation = useOperationStore((s) => s.setOperation)

  const handleDelete = async () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedPaths.length} 个文件吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const { data } = await api.post('/api/files/delete', { paths: selectedPaths, permanent: false })
          setOperation({ operation_id: data.operation_id, message: `已删除 ${selectedPaths.length} 个文件`, undo_available_until: data.undo_available_until })
          clearSelection()
        } catch (e) {
          console.error(e)
        }
      },
    })
  }

  return (
    <div className="batch-bar">
      <Text>已选 {selectedPaths.length} 项</Text>
      <Space>
        <Button size="small" icon={<SwapOutlined />} onClick={() => {/* TODO: move dialog */}}>移动</Button>
        <Button size="small" icon={<CopyOutlined />} onClick={() => {/* TODO: copy dialog */}}>复制</Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
        <Button size="small" onClick={clearSelection}>取消选择</Button>
      </Space>
    </div>
  )
}
