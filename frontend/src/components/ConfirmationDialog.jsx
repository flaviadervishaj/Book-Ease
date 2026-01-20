import './ConfirmationDialog.css'

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', loading = false }) => {
  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={loading ? undefined : onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button className={`btn btn-${type}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog

