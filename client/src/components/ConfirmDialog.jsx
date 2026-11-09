export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="row end">
          <button className="btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
