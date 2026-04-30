import { useEffect, useRef, useState, useCallback } from 'react'
import { message } from 'antd'

interface Props {
  active: boolean
  onCommand: (cmd: string, param?: string) => void
  onToggle: () => void
}

// 浏览器 SpeechRecognition 类型
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function VoiceControl({ active, onCommand, onToggle }: Props) {
  const recognitionRef = useRef<any>(null)
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      message.warning('当前浏览器不支持语音识别，请使用 Edge 或 Chrome')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.continuous = true
    rec.maxAlternatives = 1

    rec.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      const text = final || interim
      setTranscript(text)

      // 重置静默计时器
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (final) {
          parseCommand(final)
          setTranscript('')
        }
      }, 1500)
    }

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      console.error('语音错误:', e.error)
    }

    rec.onend = () => {
      setListening(false)
      if (active) {
        // 自动重启
        try { rec.start(); setListening(true) } catch {}
      }
    }

    recognitionRef.current = rec
    return () => {
      try { rec.stop() } catch {}
    }
  }, [active])

  useEffect(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (active) {
      try { rec.start(); setListening(true); setTranscript('') } catch {}
    } else {
      try { rec.stop(); setListening(false); setTranscript('') } catch {}
    }
  }, [active])

  const parseCommand = useCallback((text: string) => {
    const t = text.trim()
    if (!t) return

    // 重命名为 XXX
    const renameMatch = t.match(/重命名[为]?\s*(.+)/i)
    if (renameMatch) { onCommand('rename', renameMatch[1]); return }

    if (t.includes('移动') || t.includes('移动到')) { onCommand('move'); return }
    if (t.includes('复制') || t.includes('复制到')) { onCommand('copy'); return }
    if (t.includes('删除')) { onCommand('delete'); return }
    if (t.includes('预览')) { onCommand('preview'); return }
    if (t.includes('新建') || t.includes('创建')) { onCommand('newfolder'); return }
    if (t.includes('收藏')) { onCommand('favorite'); return }
    if (t.includes('桌面')) { onCommand('navigate', '/Users/yizheng/Desktop'); return }
    if (t.includes('下载')) { onCommand('navigate', '/Users/yizheng/Downloads'); return }
    if (t.includes('文稿') || t.includes('文档')) { onCommand('navigate', '/Users/yizheng/Documents'); return }
    if (t.includes('刷新')) { onCommand('refresh'); return }
    if (t.includes('停止') || t.includes('关闭')) { onToggle(); return }

    message.info(`未识别命令: "${t}"`)
  }, [onCommand, onToggle])

  return null // UI 在 Toolbar 中
}

export { type Props as VoiceControlProps }
