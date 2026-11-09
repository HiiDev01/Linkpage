export default function Field({ label, error, hint, as = 'input', ...props }) {
  const Tag = as;
  return (
    <label className="field">
      <span>{label}</span>
      <Tag {...props} aria-invalid={!!error} />
      {error ? <small className="err">{error}</small> : hint ? <small className="muted">{hint}</small> : null}
    </label>
  );
}
