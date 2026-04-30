import { useState } from 'react'
import { Modal, Button, List, Typography, Radio, Space, Input, message, Spin, Tag } from 'antd'
import { RobotOutlined, CheckOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import { useOperationStore } from '../../stores/operationStore'
import api from '../../api/client'

const { Text, Title } = Typography

interface Suggestion {
  name: string; confidence: number; reasoning: string
}

interface FileSuggestion {
  original_name: string
  suggested_names: Suggestion[]
  file_type: string
  extracted_info: { has_content: boolean; content_summary?: string }
}

interface Props {
  open: boolean
  filePaths: string[]
  onClose: () => void
}

export default function AIRenameDialog({ open, filePaths, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<FileSuggestion[]>([])
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [customNames, setCustomNames] = useState<Record<number, string>>({})
  const [applying, setApplying] = useState(false)
  const triggerRefresh = useBrowserStore((s) => s.triggerRefresh)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/ai-rename/suggest', { paths: filePaths })
      if (data.suggestions) {
        setSuggestions(data.suggestions)
        // 默认选择第一个建议
        const sel: Record<number, string> = {}
        data.suggestions.forEach((fs: FileSuggestion, i: number) => {
          if (fs.suggested_names && fs.suggested_names.length > 0) {
            sel[i] = fs.suggested_names[0].name
          }
        })
        setSelected(sel)
      }
    } catch (e: any) {
      if (e.response?.status === 502 || e.message?.includes('API')) {
        message.error('AI服务不可用，请检查 DEEPSEEK_API_KEY 环境变量是否已设置')
      } else {
        message.error(`分析失败: ${e.message}`)
      }
    }
    setLoading(false)
  }

  const handleApply = async () => {
    const renames = filePaths.map((path, i) => {
      const name = customNames[i] || selected[i]
      return { original_path: path, new_name: name }
    }).filter(r => r.new_name)

    if (renames.length === 0) { message.warning('没有需要重命名的文件'); return }

    setApplying(true)
    try {
      const { data } = await api.post('/api/ai-rename/apply', { renames })
      const ok = data.results.filter((r: any) => r.success).length
      message.success(`已完成 ${ok} 个文件的重命名`)
      triggerRefresh()
      onClose()
    } catch (e: any) { message.error(`重命名失败: ${e.message}`) }
    setApplying(false)
  }

  return (
    <Modal
      title={<><RobotOutlined /> AI 智能重命名 ({filePaths.length} 个文件)</>}
      open={open} onCancel={onClose} width={720}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          {suggestions.length > 0 && (
            <Button type="primary" icon={<CheckOutlined />} onClick={handleApply} loading={applying}>
              应用重命名
            </Button>
          )}
          <Button type="primary" icon={<RobotOutlined />} onClick={handleAnalyze} loading={loading}>
            AI 分析
          </Button>
        </Space>
      }
    >
      {suggestions.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
          <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>点击「AI 分析」按钮，AI 将分析文件内容并推荐科学命名</p>
          <p style={{ fontSize: 12 }}>需要设置环境变量 DEEPSEEK_API_KEY</p>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 32 }}><Spin size="large" tip="AI 正在分析文件内容..." /></div>}

      {suggestions.map((fs, i) => {
        const origName = fs.original_name
        const curSel = selected[i]
        const customName = customNames[i]

        return (
          <div key={i} style={{ marginBottom: 20, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">原文件名: </Text>
              <Text delete>{origName}</Text>
              {fs.extracted_info?.content_summary && (
                <Tag style={{ marginLeft: 8 }} color="blue">已分析内容</Tag>
              )}
            </div>

            <Radio.Group
              value={customName ? '__custom__' : curSel}
              onChange={(e) => {
                if (e.target.value === '__custom__') return
                const newSel = { ...selected, [i]: e.target.value }
                setSelected(newSel)
                const newCustom = { ...customNames }; delete newCustom[i]; setCustomNames(newCustom)
              }}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {fs.suggested_names?.map((sn, j) => (
                  <Radio key={j} value={sn.name} style={{ width: '100%' }}>
                    <Text strong>{sn.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      ({(sn.confidence * 100).toFixed(0)}%) {sn.reasoning}
                    </Text>
                  </Radio>
                ))}

                <Radio value="__custom__" onClick={() => {
                  const newCustom = { ...customNames, [i]: origName }; setCustomNames(newCustom)
                }}>
                  自定义:
                  <Input
                    size="small"
                    value={customName || ''}
                    onChange={(e) => setCustomNames({ ...customNames, [i]: e.target.value })}
                    style={{ width: 300, marginLeft: 8 }}
                    placeholder="输入自定义名称..."
                  />
                </Radio>
              </Space>
            </Radio.Group>
          </div>
        )
      })}
    </Modal>
  )
}
