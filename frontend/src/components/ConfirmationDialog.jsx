import './ConfirmationDialog.css'

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', loading = false }) => {
  if (!isOpen) return null

  const handleConfirmClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!loading && onConfirm) {
      onConfirm()
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button 
            className="btn btn-secondary" 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }} 
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className={`btn btn-${type}`} 
            onClick={handleConfirmClick}
            disabled={loading}
            type="button"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog

