import { Table, Checkbox } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { formatFileSize, formatDate } from '../../utils/format'
import type { FileInfo } from '../../types/file'
import ContextMenu from './ContextMenu'

interface Props {
  files: FileInfo[]
}

export default function FileTable({ files }: Props) {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const toggleSelect = useBrowserStore((s) => s.toggleSelectPath)
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)

  const handleClick = (file: FileInfo) => {
    if (file.is_dir) {
      setCurrentPath(file.path)
    } else {
      setShowPreview(true, file.path)
    }
  }

  const columns: ColumnsType<FileInfo> = [
    {
      title: '',
      dataIndex: 'path',
      width: 40,
      render: (path: string) => (
        <Checkbox checked={selectedPaths.includes(path)} onChange={() => toggleSelect(path)} />
      ),
    },
    {
      title: '文件名',
      dataIndex: 'name',
      render: (name: string, record: FileInfo) => (
        <span
          style={{ cursor: 'pointer', color: record.is_dir ? '#1677ff' : 'inherit' }}
          onDoubleClick={() => handleClick(record)}
        >
          {record.is_dir ? <FolderOutlined style={{ marginRight: 8, color: '#faad14' }} /> : <FileOutlined style={{ marginRight: 8 }} />}
          {name}
        </span>
      ),
      sorter: true,
    },
    {
      title: '修改日期',
      dataIndex: 'modified_at',
      width: 180,
      render: (v: string) => formatDate(v),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (v: number, record: FileInfo) => record.is_dir ? '-' : formatFileSize(v),
    },
    {
      title: '类型',
      dataIndex: 'extension',
      width: 80,
      render: (v: string, record: FileInfo) => record.is_dir ? '文件夹' : v,
    },
  ]

  return (
    <Table
      dataSource={files}
      columns={columns}
      rowKey="path"
      size="small"
      pagination={false}
      showSorterTooltip={false}
      onRow={(record) => ({
        onClick: () => handleClick(record),
        onContextMenu: (e) => {
          e.preventDefault()
        },
        style: { cursor: 'pointer' },
      })}
      components={{
        body: {
          row: (props: any) => {
            const isSelected = selectedPaths.includes(props['data-row-key'] as string)
            return (
              <ContextMenu file={files.find(f => f.path === props['data-row-key'])!}>
                <tr {...props} style={{ ...props.style, background: isSelected ? '#e6f4ff' : undefined }} />
              </ContextMenu>
            )
          },
        },
      }}
    />
  )
}
