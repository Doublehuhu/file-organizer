import { create } from 'zustand'

interface OperationInfo {
  operation_id: string
  message: string
  undo_available_until: string
}

interface OperationState {
  lastOperation: OperationInfo | null
  setOperation: (op: OperationInfo) => void
  clearOperation: () => void
}

export const useOperationStore = create<OperationState>((set) => ({
  lastOperation: null,
  setOperation: (op) => set({ lastOperation: op }),
  clearOperation: () => set({ lastOperation: null }),
}))
