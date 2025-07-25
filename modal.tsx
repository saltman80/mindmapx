import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
// Implement a small focus trap to avoid pulling in the external
// `focus-trap-react` dependency which is not available in this
// repository. The component keeps focus within the modal by looping
// focusable elements when Tab or Shift+Tab are pressed.
const FocusTrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getFocusable = () =>
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = Array.from(getFocusable())
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <div ref={containerRef}>{children}</div>
}

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
    <FocusTrap>
      <div className="fixed inset-0 z-50">
        <div className="modal-backdrop" onClick={onClose} />
        <div
          className="modal-content overflow-y-auto"
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