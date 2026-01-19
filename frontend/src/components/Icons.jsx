// Service Icons Component
export const ServiceIcon = ({ type }) => {
  const iconMap = {
    haircut: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M4 12h16M6 6h12M6 18h12" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    beard: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8 2 5 5 5 9c0 2 1 4 2 5v6h10v-6c1-1 2-3 2-5 0-4-3-7-7-7z"/>
        <rect x="9" y="14" width="6" height="4" rx="1"/>
      </svg>
    ),
    color: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    ),
    wash: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M6 6h12M8 12h8M6 18h12M4 22h16"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    treatment: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    wedding: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L8 8h8l-4-6zM6 10h12v2H6zM8 14h8v6H8z"/>
        <circle cx="10" cy="18" r="1" fill="white"/>
        <circle cx="14" cy="18" r="1" fill="white"/>
      </svg>
    ),
    extension: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M4 8h16M4 16h16"/>
        <circle cx="8" cy="12" r="2"/>
        <circle cx="16" cy="12" r="2"/>
      </svg>
    ),
    perm: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6c0-2 2-4 4-4s4 2 4 4M14 18c0 2-2 4-4 4s-4-2-4-4"/>
        <path d="M10 6v12"/>
      </svg>
    ),
    consultation: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
    package: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
        <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    kids: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6"/>
        <circle cx="9" cy="6" r="1" fill="white"/>
        <circle cx="15" cy="6" r="1" fill="white"/>
      </svg>
    ),
    default: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 9h6v6H9z"/>
      </svg>
    )
  }

  return (
    <span className="service-icon-svg">
      {iconMap[type] || iconMap.default}
    </span>
  )
}

// Search Icon
export const SearchIcon = () => (
  <svg 
    className="icon-search" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

// Clock Icon
export const ClockIcon = () => (
  <svg 
    className="icon-clock" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
)

// Money Icon
export const MoneyIcon = () => (
  <svg 
    className="icon-money" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

// Stats Icons
export const StatsIcon = () => (
  <svg 
    className="icon-stats" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

// Calendar Icon
export const CalendarIcon = () => (
  <svg 
    className="icon-calendar" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

// Location Icon
export const LocationIcon = () => (
  <svg 
    className="icon-location" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

// Check Icon
export const CheckIcon = () => (
  <svg 
    className="icon-check" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// X Icon
export const XIcon = () => (
  <svg 
    className="icon-x" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// Copy Icon
export const CopyIcon = () => (
  <svg 
    className="icon-copy" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

// Refresh Icon
export const RefreshIcon = () => (
  <svg 
    className="icon-refresh" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

// Document Icon
export const DocumentIcon = () => (
  <svg 
    className="icon-document" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

// Sun Icon (for light mode)
export const SunIcon = () => (
  <svg 
    className="icon-sun" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

// Moon Icon (for dark mode)
export const MoonIcon = () => (
  <svg 
    className="icon-moon" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

