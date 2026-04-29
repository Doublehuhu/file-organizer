import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useBrowserStore } from './stores/browserStore'
import { useOperationStore } from './stores/operationStore'
import AppLayout from './components/layout/AppLayout'
import UndoToast from './components/common/UndoToast'

export default function App() {
  const lastOp = useOperationStore((s) => s.lastOperation)
  const clearOp = useOperationStore((s) => s.clearOperation)

  return (
    <>
      <Routes>
        <Route path="/*" element={<AppLayout />} />
      </Routes>
      {lastOp && (
        <UndoToast
          operationId={lastOp.operation_id}
          message={lastOp.message}
          onClose={clearOp}
        />
      )}
    </>
  )
}
