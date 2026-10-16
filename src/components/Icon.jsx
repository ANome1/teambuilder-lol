import { roleIcon } from '../lib/roles'

const PATHS = {
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-3.5-3.5',
  logo: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 8v8M8 10l4 2 4-2',
}

// Icône décorative en trait ; mettre un aria-label sur le bouton qui la contient.
export function Icon({ name, path, size = 18, strokeWidth = 2, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={path ?? PATHS[name]} />
    </svg>
  )
}

export const RoleIcon = ({ role, size = 14, className }) => (
  <Icon path={roleIcon(role)} size={size} strokeWidth={2.2} className={className} />
)
