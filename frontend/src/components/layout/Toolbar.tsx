import { Button, Space, Tooltip, Badge } from 'antd'
import { HomeOutlined, DesktopOutlined, FolderOutlined, EditOutlined, SwapOutlined, CopyOutlined, EyeOutlined, DeleteOutlined, StarOutlined, FolderAddOutlined, AudioOutlined, SettingOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import type { FileInfo } from '../../types/file'

const NAV_ITEMS = [
  { label: '桌面', path: '/Users/yizheng/Desktop', icon: <DesktopOutlined /> },
  { label: '文稿', path: '/Users/yizheng/Documents', icon: <FolderOutlined /> },
  { label: '下载', path: '/Users/yizheng/Downloads', icon: <FolderOutlined /> },
  { label: '个人', path: '/Users/yizheng', icon: <HomeOutlined /> },
]

interface Props {
  activeFile: FileInfo | null
  onRename: () => void
  onMove: () => void
  onCopy: () => void
  onPreview: () => void
  onDelete: () => void
  onNewFolder: () => void
  onAddFavorite: () => void
  onToggleVoice: () => void
  onOpenSettings: () => void
  voiceActive: boolean
}

export default function Toolbar({ activeFile, onRename, onMove, onCopy, onPreview, onDelete, onNewFolder, onAddFavorite, onToggleVoice, onOpenSettings, voiceActive }: Props) {
  const setCurrentPath = useBrowserStore((s) => s.setCurrentPath)
  const hasSelection = !!activeFile

  const btnStyle = (active: boolean): React.CSSProperties => ({
    height: 48, padding: '4px 16px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    opacity: active ? 1 : 0.45, transition: 'all 0.2s',
    borderRadius: 8, border: 'none',
  })

  return (
    <div style={{ padding: '4px 12px', background: '#fff', borderBottom: '2px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 0 }}>
      {/* 导航 */}
      <div style={{ display: 'flex', gap: 2, marginRight: 16, paddingRight: 16, borderRight: '1px solid #f0f0f0' }}>
        {NAV_ITEMS.map(item => (
          <Tooltip title={item.path} key={item.path}>
            <Button type="text" style={btnStyle(true)} onClick={() => setCurrentPath(item.path)}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 11, lineHeight: 1 }}>{item.label}</span>
            </Button>
          </Tooltip>
        ))}
      </div>

      {/* 操作 */}
      <div style={{ display: 'flex', gap: 2, marginRight: 16, paddingRight: 16, borderRight: '1px solid #f0f0f0' }}>
        <Tooltip title="重命名 ⌘R">
          <Button type="text" style={btnStyle(hasSelection)} disabled={!hasSelection} onClick={onRename}>
            <span style={{ fontSize: 20, color: hasSelection ? '#1677ff' : undefined }}><EditOutlined /></span>
            <span style={{ fontSize: 11 }}>重命名</span>
          </Button>
        </Tooltip>
        <Tooltip title="移动到... ⌘M">
          <Button type="text" style={btnStyle(hasSelection)} disabled={!hasSelection} onClick={onMove}>
            <span style={{ fontSize: 20, color: hasSelection ? '#fa8c16' : undefined }}><SwapOutlined /></span>
            <span style={{ fontSize: 11 }}>移动</span>
          </Button>
        </Tooltip>
        <Tooltip title="复制到... ⌘C">
          <Button type="text" style={btnStyle(hasSelection)} disabled={!hasSelection} onClick={onCopy}>
            <span style={{ fontSize: 20, color: hasSelection ? '#52c41a' : undefined }}><CopyOutlined /></span>
            <span style={{ fontSize: 11 }}>复制</span>
          </Button>
        </Tooltip>
        <Tooltip title="预览 ⌘P">
          <Button type="text" style={btnStyle(hasSelection)} disabled={!hasSelection} onClick={onPreview}>
            <span style={{ fontSize: 20, color: hasSelection ? '#1677ff' : undefined }}><EyeOutlined /></span>
            <span style={{ fontSize: 11 }}>预览</span>
          </Button>
        </Tooltip>
        <Tooltip title="删除 ⌘⌫">
          <Button type="text" style={btnStyle(hasSelection)} disabled={!hasSelection} onClick={onDelete}>
            <span style={{ fontSize: 20, color: hasSelection ? '#ff4d4f' : undefined }}><DeleteOutlined /></span>
            <span style={{ fontSize: 11 }}>删除</span>
          </Button>
        </Tooltip>
      </div>

      {/* 工具 */}
      <div style={{ display: 'flex', gap: 2 }}>
        <Tooltip title="收藏当前目录">
          <Button type="text" style={btnStyle(true)} onClick={onAddFavorite}>
            <span style={{ fontSize: 20, color: '#faad14' }}><StarOutlined /></span>
            <span style={{ fontSize: 11 }}>收藏</span>
          </Button>
        </Tooltip>
        <Tooltip title="新建文件夹">
          <Button type="text" style={btnStyle(true)} onClick={onNewFolder}>
            <span style={{ fontSize: 20, color: '#1677ff' }}><FolderAddOutlined /></span>
            <span style={{ fontSize: 11 }}>新建</span>
          </Button>
        </Tooltip>
        <Tooltip title={voiceActive ? '停止语音' : '语音控制'}>
          <Button type="text" style={{ ...btnStyle(true), background: voiceActive ? '#fff1f0' : undefined }} onClick={onToggleVoice}>
            <Badge dot={voiceActive} color="#ff4d4f">
              <span style={{ fontSize: 20, color: voiceActive ? '#ff4d4f' : '#722ed1' }}><AudioOutlined /></span>
            </Badge>
            <span style={{ fontSize: 11 }}>{voiceActive ? '监听中' : '语音'}</span>
          </Button>
        </Tooltip>
        <Tooltip title="设置">
          <Button type="text" style={btnStyle(true)} onClick={onOpenSettings}>
            <span style={{ fontSize: 20 }}><SettingOutlined /></span>
            <span style={{ fontSize: 11 }}>设置</span>
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
