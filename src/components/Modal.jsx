import { useEffect } from 'react'
import { Icon } from './Icon'

<<<<<<< HEAD
// `wide` : fenêtre élargie sur grand écran, pour un contenu sur deux colonnes.
export default function Modal({ title, onClose, children, wide = false }) {
=======
export default function Modal({ eyebrow, title, onClose, children }) {
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-[#050609]/85 px-4 py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
<<<<<<< HEAD
      <div className={`w-full rounded-md border border-gold bg-surface p-5 ${wide ? 'max-w-2xl lg:max-w-6xl' : 'max-w-2xl'}`}>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gold-light">{title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fermer">
            ✕
=======
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-[880px] overflow-hidden rounded-2xl border border-[#262c3a] bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-line-soft px-6 py-5">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 id="modal-title" className="text-[22px] font-bold">{title}</h2>
          </div>
          <button type="button" className="grid size-11 place-items-center rounded-[10px] bg-[#181c25] text-soft hover:text-text" onClick={onClose} aria-label="Fermer">
            <Icon name="close" strokeWidth={2.2} />
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

// Pied de modale : erreur éventuelle + boutons Annuler / Enregistrer.
export function ModalFooter({ error, onCancel, saving, disabled }) {
  return (
    <footer className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line-soft bg-panel px-6 py-4">
      {error && <p className="mr-auto text-danger">{error}</p>}
      <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
      <button type="submit" className="btn" disabled={saving || disabled}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </footer>
  )
}
