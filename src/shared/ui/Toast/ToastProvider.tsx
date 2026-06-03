import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import "./Toast.css";

type ToastType = "success" | "error" | "loading";

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => number;
  updateToast: (id: number, options: Partial<ToastOptions>) => void;
  removeToast: (id: number) => void;
}

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 2000;

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <span className="toast-message">{toast.message}</span>
          {toast.type === "loading" && <span className="toast-spinner" />}
          {toast.type === "success" && (
            <span className="toast-icon toast-icon-success" />
          )}
          {toast.type === "error" && (
            <span className="toast-icon toast-icon-error" />
          )}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeToast = useCallback((id: number) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ duration, ...options }: ToastOptions) => {
      const id = nextIdRef.current++;
      const resolvedDuration =
        duration !== undefined
          ? duration
          : options.type === "loading"
          ? undefined
          : DEFAULT_DURATION;

      const toast: ToastItem = { id, duration: resolvedDuration, ...options };

      setToasts((prev) => {
        if (prev.length < MAX_TOASTS) {
          return [...prev, toast];
        }

        const [oldestToast] = prev;
        if (oldestToast) {
          const oldestTimeout = timeoutsRef.current.get(oldestToast.id);
          if (oldestTimeout) {
            clearTimeout(oldestTimeout);
            timeoutsRef.current.delete(oldestToast.id);
          }
        }

        return [...prev.slice(1), toast];
      });

      if (resolvedDuration !== undefined && resolvedDuration > 0) {
        const timeout = setTimeout(() => {
          removeToast(id);
        }, resolvedDuration);

        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [removeToast],
  );

  const updateToast = useCallback(
    (id: number, options: Partial<ToastOptions>) => {
      const existingTimeout = timeoutsRef.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutsRef.current.delete(id);
      }

      setToasts((prev) =>
        prev.map((toast) => {
          if (toast.id !== id) return toast;
          const updated = { ...toast, ...options };

          const resolvedDuration =
            options.duration !== undefined
              ? options.duration
              : updated.type === "loading"
              ? undefined
              : DEFAULT_DURATION;

          if (resolvedDuration !== undefined && resolvedDuration > 0) {
            const timeout = setTimeout(() => {
              removeToast(id);
            }, resolvedDuration);
            timeoutsRef.current.set(id, timeout);
          }

          return { ...updated, duration: resolvedDuration };
        }),
      );
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, updateToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
