// `icon` : tracé SVG (viewBox 24×24, en trait) utilisé par <RoleIcon>.
export const ROLES = [
  { key: 'top', label: 'Top', icon: 'M4 20V4h16M9 15V9h6' },
  { key: 'jungle', label: 'Jungle', icon: 'M12 3c4.5 5 4.5 12 0 18c-4.5-6-4.5-13 0-18zM12 8v9' },
  { key: 'mid', label: 'Mid', icon: 'M5 19L19 5M5 10V5h5M19 14v5h-5' },
  { key: 'adc', label: 'ADC', icon: 'M20 4v16H4M15 9v6H9' },
  { key: 'support', label: 'Support', icon: 'M12 3l7 3v5c0 5-3 8-7 10c-4-2-7-5-7-10V6z' },
]

export const roleLabel = (key) => ROLES.find((r) => r.key === key)?.label ?? key
export const roleIcon = (key) => ROLES.find((r) => r.key === key)?.icon
