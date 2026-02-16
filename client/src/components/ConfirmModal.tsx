import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          {danger && (
            <div className="confirm-icon-wrap">
              <AlertTriangle size={24} />
            </div>
          )}
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            id="confirm-action-btn"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
