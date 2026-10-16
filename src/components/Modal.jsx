import { useEffect } from 'react'
import { Icon } from './Icon'

// `wide` : grande fenêtre pour un contenu sur deux volets. Sur grand écran, elle tient dans la hauteur de l'écran :
// le contenu (enfant en flex-1) défile dans ses volets et le pied de la fenêtre reste visible.
// `headerContent` : contenu ajouté dans l'en-tête, entre le titre et le bouton Fermer (ex : un champ de nom).
export default function Modal({ eyebrow, title, onClose, children, wide = false, headerContent = null }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-[#050609]/85 px-4 py-10 lg:py-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full overflow-clip rounded-2xl border border-[#262c3a] bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.6)] ${
          wide ? 'max-w-[880px] lg:flex lg:h-[calc(100dvh-3rem)] lg:max-w-7xl lg:flex-col' : 'max-w-[880px]'
        }`}
      >
        <header className={`flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line-soft px-6 ${wide ? 'py-4' : 'py-5'}`}>
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 id="modal-title" className="text-[22px] font-bold">{title}</h2>
          </div>
          {/* Sur mobile, sous le titre en pleine largeur ; sinon entre le titre et Fermer. */}
          {headerContent && <div className="order-last min-w-0 basis-full sm:order-none sm:max-w-xl sm:flex-1 sm:basis-auto">{headerContent}</div>}
          <button type="button" className="grid size-11 place-items-center rounded-[10px] bg-[#181c25] text-soft hover:text-text" onClick={onClose} aria-label="Fermer">
            <Icon name="close" strokeWidth={2.2} />
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
    <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-line-soft bg-panel px-6 py-4">
      {error && <p className="mr-auto text-danger">{error}</p>}
      <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
      <button type="submit" className="btn" disabled={saving || disabled}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </footer>
  )
}
