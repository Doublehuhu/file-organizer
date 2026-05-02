import { useEffect, useRef, useCallback } from 'react'
import { message } from 'antd'

interface Props {
  active: boolean
  onCommand: (cmd: string, param?: string) => void
  onToggle: () => void
}

declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any } }

export default function VoiceControl({ active, onCommand, onToggle }: Props) {
  const recRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const activeRef = useRef(active)
  activeRef.current = active

  const parseCommand = useCallback((text: string) => {
    const t = text.trim()
    if (!t) return
    const m = t.match(/重命名[为]?\s*(.+)/i)
    if (m) { onCommand('rename', m[1]); return }
    if (t.includes('移动') || t.includes('移到')) { onCommand('move'); return }
    if (t.includes('复制') || t.includes('拷到')) { onCommand('copy'); return }
    if (t.includes('删除')) { onCommand('delete'); return }
    if (t.includes('预览') || t.includes('查看')) { onCommand('preview'); return }
    if (t.includes('新建') || t.includes('创建文件夹')) { onCommand('newfolder'); return }
    if (t.includes('收藏')) { onCommand('favorite'); return }
    if (t.includes('桌面')) { onCommand('navigate', '/Users/yizheng/Desktop'); return }
    if (t.includes('下载')) { onCommand('navigate', '/Users/yizheng/Downloads'); return }
    if (t.includes('文稿') || t.includes('文档')) { onCommand('navigate', '/Users/yizheng/Documents'); return }
    if (t.includes('刷新')) { onCommand('refresh'); return }
    if (t.includes('停止') || t.includes('关闭语音')) { onToggle(); return }
  }, [onCommand, onToggle])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.continuous = true

    rec.onresult = (event: any) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
      }
      if (!final) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => parseCommand(final), 800)
    }

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      if (e.error === 'not-allowed') message.warning('请允许麦克风权限')
    }

    rec.onend = () => {
      if (activeRef.current) {
        setTimeout(() => { try { rec.start() } catch {} }, 100)
      }
    }

    recRef.current = rec
    return () => { try { rec.stop() } catch {} }
  }, [])

  useEffect(() => {
    const rec = recRef.current
    if (!rec) return
    if (active) {
      try { rec.start(); message.info('🎤 语音已开启') } catch {}
    } else {
      try { rec.stop() } catch {}
    }
  }, [active])

  return null
}

export { type Props as VoiceControlProps }
