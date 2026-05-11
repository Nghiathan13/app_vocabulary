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

type ToastType = "success" | "error";

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
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
          {toast.message}
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
    ({ duration = DEFAULT_DURATION, ...options }: ToastOptions) => {
      const id = nextIdRef.current++;
      const toast: ToastItem = { id, duration, ...options };

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

      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);

      timeoutsRef.current.set(id, timeout);
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
    <ToastContext.Provider value={{ showToast }}>
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
