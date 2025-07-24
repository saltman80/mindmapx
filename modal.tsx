import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusTrap from 'focus-trap-react'

let openModalCount = 0
let originalOverflow = ''

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaLabel?: string
  ariaLabelledBy?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  ariaLabel,
  ariaLabelledBy,
}) => {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen || !isBrowser) return
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    openModalCount++
    if (openModalCount === 1) {
      originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      openModalCount--
      if (openModalCount === 0) {
        document.body.style.overflow = originalOverflow
      }
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !isBrowser) return null

  const ariaProps: {
    'aria-label'?: string
    'aria-labelledby'?: string
  } = {}
  if (ariaLabelledBy) ariaProps['aria-labelledby'] = ariaLabelledBy
  if (ariaLabel) ariaProps['aria-label'] = ariaLabel

  const modalContent = (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: closeButtonRef.current || undefined,
        fallbackFocus: closeButtonRef.current || undefined,
        escapeDeactivates: false,
      }}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div
          className="relative bg-white rounded-lg p-6 max-w-lg w-full max-h-full overflow-y-auto z-10 focus:outline-none"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          {...ariaProps}
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    </FocusTrap>
  )

  return createPortal(modalContent, document.body)
}

export default Modal