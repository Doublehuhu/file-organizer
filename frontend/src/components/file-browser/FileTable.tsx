import { Table, Checkbox } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { formatFileSize, formatDate } from '../../utils/format'
import type { FileInfo } from '../../types/file'
import ContextMenu from './ContextMenu'

interface Props { files: FileInfo[] }

export default function FileTable({ files }: Props) {
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const selectedPaths = useBrowserStore((s) => s.selectedPaths)
  const toggleSelect = useBrowserStore((s) => s.toggleSelectPath)
  const setActiveFile = useBrowserStore((s) => s.setActiveFile)
  const setShowPreview = useBrowserStore((s) => s.setShowPreview)
  const activeFile = useBrowserStore((s) => s.activeFile)

  const columns: ColumnsType<FileInfo> = [
    { title: '', dataIndex: 'path', width: 40, render: (path: string) => <Checkbox checked={selectedPaths.includes(path)} onChange={() => toggleSelect(path)} /> },
    { title: '文件名', dataIndex: 'name', render: (name: string, r: FileInfo) => <span style={{ cursor: 'pointer', color: r.is_dir ? '#1677ff' : 'inherit' }}>{r.is_dir ? <FolderOutlined style={{ marginRight: 8, color: '#faad14' }} /> : <FileOutlined style={{ marginRight: 8 }} />}{name}</span> },
    { title: '修改日期', dataIndex: 'modified_at', width: 180, render: (v: string) => formatDate(v) },
    { title: '大小', dataIndex: 'size', width: 100, render: (v: number, r: FileInfo) => r.is_dir ? '-' : formatFileSize(v) },
    { title: '类型', dataIndex: 'extension', width: 80, render: (v: string, r: FileInfo) => r.is_dir ? '文件夹' : v },
  ]

  return (
    <Table dataSource={files} columns={columns} rowKey="path" size="small" pagination={false}
      onRow={(record) => ({
        onClick: (e) => {
          if ((e.target as HTMLElement).closest('.ant-checkbox-wrapper')) return
          setActiveFile(record)
        },
        onDoubleClick: () => {
          if (record.is_dir) setCurrentPath(record.path)
          else setShowPreview(true, record.path)
        },
        style: { cursor: 'pointer', background: activeFile?.path === record.path ? '#e6f4ff' : undefined },
      })}
      components={{ body: { row: (props: any) => { const file = files.find(f => f.path === props['data-row-key']); return <ContextMenu file={file!}><tr {...props} /></ContextMenu> } } }}
    />
  )
}
