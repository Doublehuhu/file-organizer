import { useState, useEffect } from 'react'
import { Modal, Input, Button, Typography, message, Space } from 'antd'
import { KeyOutlined, SettingOutlined } from '@ant-design/icons'
import api from '../../api/client'

const { Text, Paragraph } = Typography

interface Props { open: boolean; onClose: () => void }

export default function SettingsDialog({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [masked, setMasked] = useState(true)

  useEffect(() => {
    if (open) loadSettings()
  }, [open])

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/api/system/settings')
      const key = data.deepseek_api_key || ''
      setApiKey(key)
      setMasked(!!key)
    } catch { /* ignore */ }
  }

  const saveApiKey = async () => {
    setSaving(true)
    try {
      await api.put('/api/system/settings', { key: 'deepseek_api_key', value: apiKey })
      message.success('API Key 已保存')
      setMasked(true)
    } catch (e: any) { message.error(`保存失败: ${e.message}`) }
    setSaving(false)
  }

  const clearApiKey = async () => {
    setApiKey('')
    await api.put('/api/system/settings', { key: 'deepseek_api_key', value: '' })
    message.success('API Key 已清除')
  }

  return (
    <Modal title={<><SettingOutlined /> 设置</>} open={open} onCancel={onClose} footer={null} width={520}>
      <div style={{ marginBottom: 24 }}>
        <Text strong><KeyOutlined /> DeepSeek API Key</Text>
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          使用 DeepSeek V4 进行 AI 智能重命名和文件分类。API Key 保存在本地数据库中。
        </Paragraph>
        <Space style={{ width: '100%', marginTop: 8 }} direction="vertical">
          <Input.Password
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            visibilityToggle
          />
          <Space>
            <Button type="primary" onClick={saveApiKey} loading={saving}>保存</Button>
            {apiKey && <Button danger onClick={clearApiKey}>清除</Button>}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {apiKey ? '已配置' : '未配置 — AI功能将使用兜底建议'}
            </Text>
          </Space>
        </Space>
      </div>
    </Modal>
  )
}
