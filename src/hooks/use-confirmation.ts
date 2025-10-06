"use client"

import { useState, useCallback } from 'react'

interface ConfirmationOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmationState {
  isOpen: boolean
  options: ConfirmationOptions
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    options: {
      title: '',
      description: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'default'
    },
    onConfirm: null,
    onCancel: null
  })

  const confirm = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setState({
      isOpen: true,
      options: {
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default'
      },
      onConfirm,
      onCancel: onCancel || null
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm()
    }
    setState(prev => ({ ...prev, isOpen: false, onConfirm: null, onCancel: null }))
  }, [state.onConfirm])

  const handleCancel = useCallback(() => {
    if (state.onCancel) {
      state.onCancel()
    }
    setState(prev => ({ ...prev, isOpen: false, onConfirm: null, onCancel: null }))
  }, [state.onCancel])

  return {
    ...state,
    confirm,
    handleConfirm,
    handleCancel
  }
}
