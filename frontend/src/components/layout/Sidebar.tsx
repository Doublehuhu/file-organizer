import { useEffect, useState } from 'react'
import { Button, Typography, message, Popconfirm } from 'antd'
import { StarOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import api from '../../api/client'

const { Text } = Typography
interface FavItem { id: number; path: string; label: string }

export default function Sidebar() {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const [favorites, setFavorites] = useState<FavItem[]>([])

  const loadFavs = async () => {
    try { const { data } = await api.get('/api/files/favorites'); setFavorites(data.favorites || []) } catch {}
  }
  useEffect(() => { loadFavs() }, [currentPath])

  const addFav = async () => {
    if (!currentPath) return
    try { await api.post('/api/files/favorites', { path: currentPath }); message.success('已收藏'); loadFavs() } catch {}
  }

  return (
    <div className="app-sidebar" style={{ width: 200, minWidth: 200, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>收藏夹</Text>
        <Button type="text" size="small" icon={<PlusOutlined />} onClick={addFav} />
      </div>
      {favorites.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>点 + 收藏</Text>}
      {favorites.map((f) => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="text" icon={<StarOutlined style={{ color: '#faad14' }} />} style={{ flex: 1, textAlign: 'left', fontSize: 13 }}
            onClick={() => setCurrentPath(f.path)} title={f.path}>{f.label}</Button>
          <Popconfirm title="取消？" onConfirm={async () => { await api.delete(`/api/files/favorites/${f.id}`); loadFavs() }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>当前目录</Text>
        <div style={{ fontSize: 11, wordBreak: 'break-all', color: '#1677ff' }}>{currentPath || '未选择'}</div>
      </div>
    </div>
  )
}
