import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'
type ToastAction = { label: string; onClick: () => void }
type Toast = { 
  id: number; 
  message: string; 
  type: ToastType;
  durationMs?: number;
  action?: ToastAction;
}
type ShowToastOptions = { durationMs?: number; action?: ToastAction }
type ToastCtx = { showToast: (message: string, type?: ToastType, options?: ShowToastOptions) => void }

const Ctx = createContext<ToastCtx>({ showToast: () => {} })

export const useToast = () => useContext(Ctx)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = 'info', options?: ShowToastOptions) => {
    const id = Date.now()
    const duration = options?.durationMs ?? 3000
    setToasts(prev => [...prev, { id, message, type, durationMs: duration, action: options?.action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 space-y-2 z-50">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    // Start progress when mounted
    const duration = toast.durationMs ?? 3000
    const timer = setTimeout(() => setBarWidth(100), 10)
    const autoClose = setTimeout(onClose, duration)
    return () => { clearTimeout(timer); clearTimeout(autoClose) }
  }, [toast.durationMs, onClose])

  const base = toast.type==='success'?'bg-green-600 text-white':toast.type==='error'?'bg-red-600 text-white':'bg-zinc-800 text-white'

  return (
    <div className={`relative px-4 py-3 rounded-xl shadow font-medium ${base} min-w-[280px]`}> 
      <div className="flex items-center justify-between gap-3">
        <span>{toast.message}</span>
        {toast.action && (
          <button
            onClick={() => { toast.action?.onClick(); onClose() }}
            className="ml-2 px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-sm"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {/* Progress bar */}
      <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-white/70"
          style={{ width: `${barWidth}%`, transition: `width ${toast.durationMs ?? 3000}ms linear` }}
        />
      </div>
    </div>
  )
}