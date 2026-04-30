import { Breadcrumb, Button, Segmented } from 'antd'
import { AppstoreOutlined, UnorderedListOutlined, HomeOutlined, ColumnWidthOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import type { ViewMode, SortField } from '../../types/file'

interface Props { panelPath?: string; onNavigate?: (path: string) => void }

export default function Header({ panelPath, onNavigate }: Props) {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const viewMode = useBrowserStore((s) => s.viewMode)
  const setViewMode = useBrowserStore((s) => s.setViewMode)
  const sortField = useBrowserStore((s) => s.sortField)
  const sortOrder = useBrowserStore((s) => s.sortOrder)
  const setSortField = useBrowserStore((s) => s.setSortField)
  const toggleSortOrder = useBrowserStore((s) => s.toggleSortOrder)
  const showSecond = useBrowserStore((s) => s.showSecondPanel)
  const toggleSecond = useBrowserStore((s) => s.toggleSecondPanel)

  const displayPath = panelPath || currentPath
  const navigate = onNavigate || setCurrentPath
  const pathParts = displayPath ? displayPath.split('/').filter(Boolean) : []

  const items = [
    { title: <HomeOutlined onClick={() => navigate('/Users/yizheng')} style={{ cursor: 'pointer' }} /> },
    ...pathParts.map((part: string, i: number) => {
      const fp = '/' + pathParts.slice(0, i + 1).join('/')
      return { title: <span style={{ cursor: 'pointer' }} onClick={() => navigate(fp)}>{part}</span> }
    }),
  ]

  return (
    <div className="app-header">
      <Breadcrumb items={items} style={{ marginBottom: 4 }} />
      <div className="app-toolbar">
        <Segmented size="small" value={viewMode} onChange={(v) => setViewMode(v as ViewMode)}
          options={[{ value: 'table', icon: <UnorderedListOutlined /> }, { value: 'grid', icon: <AppstoreOutlined /> }]} />
        <Segmented size="small" value={sortField} onChange={(v) => setSortField(v as SortField)}
          options={[{ value: 'name', label: '名称' }, { value: 'date', label: '日期' }, { value: 'size', label: '大小' }, { value: 'type', label: '类型' }]} />
        <Button size="small" onClick={toggleSortOrder}>{sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}</Button>
        {!onNavigate && (
          <Button size="small" type={showSecond ? 'primary' : 'default'} icon={<ColumnWidthOutlined />} onClick={toggleSecond}>
            {showSecond ? '关闭双面板' : '双面板'}
          </Button>
        )}
      </div>
    </div>
  )
}
