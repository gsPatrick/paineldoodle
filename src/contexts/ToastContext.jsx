"use client"

import { createContext, useContext, useState } from "react"
import * as Toast from "@radix-ui/react-toast"
import { CheckCircledIcon, CrossCircledIcon, InfoCircledIcon } from "@radix-ui/react-icons"

const ToastContext = createContext({})

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...toast, id }])

    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 5000)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message, title = "Sucesso") => {
    addToast({ type: "success", title, message })
  }

  const error = (message, title = "Erro") => {
    addToast({ type: "error", title, message })
  }

  const info = (message, title = "Informação") => {
    addToast({ type: "info", title, message })
  }

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircledIcon className="w-5 h-5 text-green-600" />
      case "error":
        return <CrossCircledIcon className="w-5 h-5 text-red-600" />
      case "info":
        return <InfoCircledIcon className="w-5 h-5 text-blue-600" />
      default:
        return null
    }
  }

  const value = {
    success,
    error,
    info,
  }

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className="bg-white rounded-lg shadow-lg border p-4 flex items-start gap-3 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
            onOpenChange={(open) => !open && removeToast(toast.id)}
          >
            {getIcon(toast.type)}
            <div className="flex-1">
              <Toast.Title className="font-semibold text-gray-900">{toast.title}</Toast.Title>
              <Toast.Description className="text-gray-600 text-sm mt-1">{toast.message}</Toast.Description>
            </div>
            <Toast.Close className="text-gray-400 hover:text-gray-600">
              <CrossCircledIcon className="w-4 h-4" />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-96 max-w-[100vw] m-0 list-none z-50 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}
