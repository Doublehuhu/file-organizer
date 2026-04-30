import { useState, useEffect } from 'react'
import { Modal, Button, List, Typography, Input, Select, Space, Tag, message, Steps, Tabs, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, FolderOutlined, PlayCircleOutlined, RobotOutlined, ApartmentOutlined } from '@ant-design/icons'
import { useBrowserStore } from '../../stores/browserStore'
import api from '../../api/client'

const { Text, Title } = Typography

interface Props { open: boolean; onClose: () => void }

interface Category {
  id: number; name: string; path: string; color: string; rule_count: number
}

interface SortResult {
  groups: { category_id: number; category_name: string; files: { name: string; path: string }[] }[]
  unclassified: { name: string; path: string }[]
}

export default function AutoOrganizeDialog({ open, onClose }: Props) {
  const currentPath = useBrowserStore((s) => s.currentPath)
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [catName, setCatName] = useState('')
  const [catPath, setCatPath] = useState('')
  const [catExts, setCatExts] = useState('')
  const [loading, setLoading] = useState(false)
  const [sortResult, setSortResult] = useState<SortResult | null>(null)
  const [aiCategories, setAICategories] = useState<any[]>([])
  const triggerRefresh = useBrowserStore((s) => s.triggerRefresh)

  useEffect(() => { if (open) loadCategories() }, [open])

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/api/organize/categories')
      setCategories(data.categories || [])
    } catch { /* ignore */ }
  }

  const addCategory = async () => {
    if (!catName.trim()) return
    await api.post('/api/organize/categories', {
      name: catName, path: catPath || `${currentPath}/${catName}`,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    })
    if (catExts.trim()) {
      // 添加扩展名规则
      const exts = catExts.split(',').map(s => s.trim()).filter(Boolean)
      const cats = await api.get('/api/organize/categories')
      const newCat = cats.data.categories.find((c: Category) => c.name === catName)
      if (newCat) {
        await api.post('/api/organize/rules', {
          category_id: newCat.id, rule_type: 'extension',
          rule_value: JSON.stringify({ extensions: exts }),
        })
      }
    }
    setCatName(''); setCatPath(''); setCatExts('')
    loadCategories()
    message.success('分类已创建')
  }

  const deleteCategory = async (id: number) => {
    await api.delete(`/api/organize/categories/${id}`)
    loadCategories()
  }

  const previewSort = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/organize/preview-sort', { source_dir: currentPath, mode: 'by_category' })
      setSortResult(data)
      setStep(1)
    } catch (e: any) { message.error(`预览失败: ${e.message}`) }
    setLoading(false)
  }

  const applySort = async () => {
    if (!sortResult) return
    const assignments: { file_path: string; target_dir: string }[] = []
    sortResult.groups.forEach(g => {
      const cat = categories.find(c => c.name === g.category_name)
      if (cat) g.files.forEach(f => assignments.push({ file_path: f.path, target_dir: cat.path }))
    })
    if (assignments.length === 0) { message.warning('没有需要整理的文件'); return }
    setLoading(true)
    try {
      await api.post('/api/organize/apply-sort', { source_dir: currentPath, assignments })
      message.success(`已整理 ${assignments.length} 个文件`)
      triggerRefresh()
      onClose()
    } catch (e: any) { message.error(`整理失败: ${e.message}`) }
    setLoading(false)
  }

  const aiAnalyze = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/organize/auto-categorize', { source_dir: currentPath })
      setAICategories(data.categories || [])
      if (data.categories?.length === 0) message.info('AI 未发现明确的分类模式')
    } catch (e: any) { message.error(`AI分析失败: ${e.message}`) }
    setLoading(false)
  }

  return (
    <Modal title={<><ApartmentOutlined /> 自动整理 - {currentPath}</>} open={open} onCancel={onClose} width={700}
      footer={step === 0 ? (
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button icon={<RobotOutlined />} onClick={aiAnalyze} loading={loading}>AI 分析</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={previewSort} loading={loading}>预览整理</Button>
        </Space>
      ) : (
        <Space>
          <Button onClick={() => setStep(0)}>返回</Button>
          <Button type="primary" onClick={applySort} loading={loading}>执行整理</Button>
        </Space>
      )}
    >
      {step === 0 && (
        <Tabs items={[
          { key: 'categories', label: '分类管理', children: (
            <div>
              <Space style={{ marginBottom: 12, width: '100%' }} direction="vertical">
                <Input placeholder="分类名称（如：课件）" value={catName} onChange={e => setCatName(e.target.value)}
                  prefix={<FolderOutlined />} style={{ width: 200 }} />
                <Input placeholder="目标文件夹路径" value={catPath} onChange={e => setCatPath(e.target.value)} style={{ width: 400 }} />
                <Input placeholder="文件扩展名（如：.pdf,.docx,.pptx）" value={catExts} onChange={e => setCatExts(e.target.value)} style={{ width: 400 }} />
                <Button type="primary" icon={<PlusOutlined />} onClick={addCategory}>添加分类</Button>
              </Space>
              <List dataSource={categories} locale={{ emptyText: '暂无分类' }}
                renderItem={c => (
                  <List.Item extra={<Button danger size="small" icon={<DeleteOutlined />} onClick={() => deleteCategory(c.id)} />}>
                    <FolderOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <Text strong>{c.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>{c.path}</Text>
                    <Tag style={{ marginLeft: 8 }}>{c.rule_count} 条规则</Tag>
                  </List.Item>
                )}
              />
            </div>
          )},
          { key: 'ai', label: 'AI 建议', children: (
            <div>
              {aiCategories.length === 0 && <Empty description="点击下方「AI 分析」让DeepSeek获取建议" />}
              {aiCategories.map((c: any, i: number) => (
                <div key={i} style={{ padding: 8, marginBottom: 8, background: '#fafafa', borderRadius: 6 }}>
                  <Text strong>{c.name}</Text>
                  <Text type="secondary"> — {c.description}</Text>
                  <div><Tag>{c.criteria}</Tag></div>
                  <Text type="secondary">{c.files?.length || 0} 个文件匹配</Text>
                </div>
              ))}
            </div>
          )},
        ]} />
      )}

      {step === 1 && sortResult && (
        <div>
          <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
            共 {sortResult.groups.reduce((s, g) => s + g.files.length, 0) + sortResult.unclassified.length} 个文件
            ，{sortResult.groups.length} 个分类
          </Text>
          {sortResult.groups.map((g, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#1677ff' }}><FolderOutlined /> {g.category_name} ({g.files.length} 个)</Text>
              <div style={{ paddingLeft: 16 }}>
                {g.files.slice(0, 5).map((f, j) => <Tag key={j}>{f.name}</Tag>)}
                {g.files.length > 5 && <Text type="secondary">...等 {g.files.length} 个</Text>}
              </div>
            </div>
          ))}
          {sortResult.unclassified.length > 0 && (
            <div>
              <Text type="warning">未分类 ({sortResult.unclassified.length} 个)</Text>
              <div>{sortResult.unclassified.slice(0, 5).map((f, j) => <Tag key={j}>{f.name}</Tag>)}</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
