import { Breadcrumb, Button, Segmented, Input } from 'antd'
import { AppstoreOutlined, UnorderedListOutlined, HomeOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import type { ViewMode, SortField } from '../../types/file'

export default function Header() {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const viewMode = useBrowserStore((s) => s.viewMode)
  const setViewMode = useBrowserStore((s) => s.setViewMode)
  const sortField = useBrowserStore((s) => s.sortField)
  const sortOrder = useBrowserStore((s) => s.sortOrder)
  const setSortField = useBrowserStore((s) => s.setSortField)
  const toggleSortOrder = useBrowserStore((s) => s.toggleSortOrder)

  const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : []

  const breadcrumbItems = [
    {
      title: <HomeOutlined onClick={() => setCurrentPath('/Users/yizheng')} style={{ cursor: 'pointer' }} />,
    },
    ...pathParts.map((part, i) => {
      const fullPath = '/' + pathParts.slice(0, i + 1).join('/')
      return { title: <span style={{ cursor: 'pointer' }} onClick={() => setCurrentPath(fullPath)}>{part}</span> }
    }),
  ]

  return (
    <div className="app-header">
      <div style={{ marginBottom: 4 }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div className="app-toolbar">
        <Segmented
          size="small"
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          options={[
            { value: 'table', icon: <UnorderedListOutlined /> },
            { value: 'grid', icon: <AppstoreOutlined /> },
          ]}
        />
        <Segmented
          size="small"
          value={sortField}
          onChange={(v) => setSortField(v as SortField)}
          options={[
            { value: 'name', label: '名称' },
            { value: 'date', label: '日期' },
            { value: 'size', label: '大小' },
            { value: 'type', label: '类型' },
          ]}
        />
        <Button size="small" onClick={toggleSortOrder}>
          {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
        </Button>
      </div>
    </div>
  )
}
