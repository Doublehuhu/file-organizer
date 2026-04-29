import { useState } from 'react'
import { Input, Button, Tree, Typography } from 'antd'
import { HomeOutlined, DesktopOutlined, FolderOutlined, FolderAddOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import api from '../../api/client'

const { Text } = Typography
const { DirectoryTree } = Tree

export default function Sidebar() {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const [treeData, setTreeData] = useState<any[]>([])

  const quickAccess = [
    { name: '桌面', path: '/Users/yizheng/Desktop', icon: <DesktopOutlined /> },
    { name: '文稿', path: '/Users/yizheng/Documents', icon: <FolderOutlined /> },
    { name: '下载', path: '/Users/yizheng/Downloads', icon: <FolderOutlined /> },
    { name: '个人', path: '/Users/yizheng', icon: <HomeOutlined /> },
  ]

  const handleCreateFolder = async () => {
    if (!currentPath) return
    try {
      await api.post('/api/files/create-folder', { parent_path: currentPath, folder_name: '新建文件夹' })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="app-sidebar">
      <div style={{ marginBottom: 16 }}>
        <Text strong>快捷访问</Text>
        <div style={{ marginTop: 8 }}>
          {quickAccess.map((item) => (
            <Button
              key={item.path}
              type="text"
              icon={item.icon}
              block
              style={{ textAlign: 'left', marginBottom: 2 }}
              onClick={() => setCurrentPath(item.path)}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Button type="primary" icon={<FolderAddOutlined />} block onClick={handleCreateFolder} size="small">
          新建文件夹
        </Button>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>当前目录</Text>
        <div style={{ marginTop: 4, fontSize: 12, wordBreak: 'break-all', color: '#1677ff' }}>
          {currentPath || '未选择'}
        </div>
      </div>
    </div>
  )
}
