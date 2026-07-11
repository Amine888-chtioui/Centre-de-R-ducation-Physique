import { createContext, useCallback, useContext, useRef, useState } from "react";
import "../components/ui/toast.css";

const ToastContext = createContext(null);

let toastId = 0;

function ToastList({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="ui-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ui-toast ui-toast--${t.type} ui-toast--enter`}
          role="status"
        >
          <i className={`bi ${t.icon || "bi-bell-fill"}`} aria-hidden="true" />
          <span className="ui-toast__msg">{t.message}</span>
          <button
            type="button"
            className="ui-toast__close"
            aria-label="Fermer"
            onClick={() => onDismiss(t.id)}
          >
            <i className="bi bi-x" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const id = ++toastId;
      const toast = {
        id,
        message,
        type: options.type || "info",
        icon: options.icon,
        duration: options.duration ?? 4200,
      };

      setToasts((prev) => [...prev.slice(-4), toast]);

      const timer = setTimeout(() => dismiss(id), toast.duration);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (message, options) =>
      show(message, { ...options, type: "success", icon: "bi-check-circle-fill" }),
    [show],
  );

  const error = useCallback(
    (message, options) =>
      show(message, { ...options, type: "error", icon: "bi-exclamation-circle-fill" }),
    [show],
  );

  const info = useCallback(
    (message, options) =>
      show(message, { ...options, type: "info", icon: "bi-info-circle-fill" }),
    [show],
  );

  return (
    <ToastContext.Provider value={{ show, success, error, info, dismiss }}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit être utilisé dans ToastProvider");
  }
  return ctx;
}
