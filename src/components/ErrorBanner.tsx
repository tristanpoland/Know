// components/ErrorBanner.tsx — Dismissable error notification banner
import { useStore } from "../store";
import "./ErrorBanner.css";

export function ErrorBanner() {
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);

  if (!error) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-icon">⚠</span>
      <span className="error-message">{error}</span>
      <button className="error-dismiss" onClick={clearError} aria-label="Dismiss error">
        ✕
      </button>
    </div>
  );
}
