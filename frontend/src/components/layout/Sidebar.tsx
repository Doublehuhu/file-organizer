import { useEffect, useState } from 'react'
import { Button, Typography, message, Popconfirm } from 'antd'
import { HomeOutlined, DesktopOutlined, FolderOutlined, FolderAddOutlined, StarOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import api from '../../api/client'

const { Text } = Typography

interface FavItem { id: number; path: string; label: string }

const BUILTIN = [
  { name: '桌面', path: '/Users/yizheng/Desktop', icon: <DesktopOutlined /> },
  { name: '文稿', path: '/Users/yizheng/Documents', icon: <FolderOutlined /> },
  { name: '下载', path: '/Users/yizheng/Downloads', icon: <FolderOutlined /> },
  { name: '个人', path: '/Users/yizheng', icon: <HomeOutlined /> },
]

export default function Sidebar() {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const triggerRefresh = useBrowserStore((s) => s.triggerRefresh)
  const [favorites, setFavorites] = useState<FavItem[]>([])

  const loadFavs = async () => {
    try {
      const { data } = await api.get('/api/files/favorites')
      setFavorites(data.favorites || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadFavs() }, [currentPath])

  const addFav = async () => {
    if (!currentPath) return
    try {
      await api.post('/api/files/favorites', { path: currentPath })
      message.success('已收藏')
      loadFavs()
    } catch (e: any) { message.error(`失败: ${e.message}`) }
  }

  const handleNewFolder = async () => {
    if (!currentPath) return
    try {
      await api.post('/api/files/create-folder', { parent_path: currentPath, folder_name: '新建文件夹' })
      triggerRefresh()
    } catch { /* ignore */ }
  }

  return (
    <div className="app-sidebar">
      <div style={{ marginBottom: 8 }}>
        <Text strong>快捷访问</Text>
        <div style={{ marginTop: 4 }}>
          {BUILTIN.map((item) => (
            <Button key={item.path} type="text" icon={item.icon} block style={{ textAlign: 'left', marginBottom: 2 }}
              onClick={() => setCurrentPath(item.path)}>{item.name}</Button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 13 }}>收藏夹</Text>
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={addFav} title="添加当前目录" />
        </div>
        <div style={{ marginTop: 4 }}>
          {favorites.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>点 + 收藏当前目录</Text>}
          {favorites.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <Button type="text" icon={<StarOutlined style={{ color: '#faad14' }} />} style={{ flex: 1, textAlign: 'left', fontSize: 13 }}
                onClick={() => setCurrentPath(f.path)} title={f.path}>{f.label}</Button>
              <Popconfirm title="取消收藏？" onConfirm={async () => { await api.delete(`/api/files/favorites/${f.id}`); loadFavs() }} okText="是" cancelText="否">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Button type="primary" icon={<FolderAddOutlined />} block onClick={handleNewFolder} size="small">新建文件夹</Button>
      </div>

      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>当前目录</Text>
        <div style={{ marginTop: 4, fontSize: 12, wordBreak: 'break-all', color: '#1677ff' }}>{currentPath || '未选择'}</div>
      </div>
    </div>
  )
}
