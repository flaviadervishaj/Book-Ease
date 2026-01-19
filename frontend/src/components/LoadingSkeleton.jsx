import './LoadingSkeleton.css'

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-header">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-cell skeleton-header-cell" />
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  )
}

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="skeleton-cards">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-icon" />
          <div className="skeleton-card-content">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const FormSkeleton = () => {
  return (
    <div className="skeleton-form">
      <div className="skeleton-line skeleton-title-large" />
      <div className="skeleton-form-row">
        <div className="skeleton-input-group">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-input" />
        </div>
        <div className="skeleton-input-group">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-input" />
        </div>
      </div>
      <div className="skeleton-input-group">
        <div className="skeleton-line skeleton-label" />
        <div className="skeleton-textarea" />
      </div>
    </div>
  )
}

