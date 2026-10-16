import { useEffect } from 'react'

// `wide` : fenêtre élargie sur grand écran, pour un contenu sur deux colonnes.
export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full rounded-md border border-gold bg-surface p-5 ${wide ? 'max-w-2xl lg:max-w-6xl' : 'max-w-2xl'}`}>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gold-light">{title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
