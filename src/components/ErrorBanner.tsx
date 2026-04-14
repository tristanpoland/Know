// components/ErrorBanner.tsx — Red-tinted toast notification, lower-right corner
import { useEffect } from "react";
import { useStore } from "../store";
import "./ErrorBanner.css";

const AUTO_DISMISS_MS = 6000;

export function ErrorBanner() {
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="error-toast" role="alert">
      <div className="error-toast-icon">
        <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="error-toast-message">{error}</span>
      <button className="error-toast-dismiss" onClick={clearError} aria-label="Dismiss error">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" width={10} height={10}>
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  );
}
