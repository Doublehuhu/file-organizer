import { useEffect, useState } from 'react'
import { Button, Typography } from 'antd'
import { UndoOutlined } from '@ant-design/icons'
import api from '../../api/client'
import { useBrowserStore } from '../../stores/browserStore'

const { Text } = Typography

interface Props {
  operationId: string
  message: string
  onClose: () => void
}

export default function UndoToast({ operationId, message, onClose }: Props) {
  const [countdown, setCountdown] = useState(30)
  const currentPath = useBrowserStore((s) => s.currentPath)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onClose])

  const handleUndo = async () => {
    try {
      await api.post('/api/files/undo', { operation_id: operationId })
    } catch (e) {
      console.error(e)
    }
    onClose()
  }

  return (
    <div className="undo-toast">
      <div style={{
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        padding: '12px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Text>{message}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={handleUndo}>
          撤销 ({countdown}s)
        </Button>
      </div>
    </div>
  )
}
