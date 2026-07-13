export default function LoadingSpinner({ text = "Chargement...", inline = false }) {
  return (
    <div className={`loading-spinner${inline ? " loading-spinner--inline" : ""}`}>
      <div className="loading-spinner__circle" aria-hidden="true" />
      {text && <p className="loading-spinner__text">{text}</p>}
    </div>
  );
}
