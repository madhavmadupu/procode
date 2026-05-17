import { useEffect, useState } from "react";
import { useErrorStore } from "../../stores/error.store";

interface Notification {
  id: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export function NotificationToast() {
  const { errors, removeError } = useErrorStore();
  const [visible, setVisible] = useState<Notification[]>([]);

  useEffect(() => {
    const newNotifications: Notification[] = errors.map((err) => ({
      id: err.id,
      message: err.message,
      severity: err.severity,
    }));

    setVisible(newNotifications);

    const timers = newNotifications.map((notification) =>
      setTimeout(() => {
        setVisible((prev) => prev.filter((n) => n.id !== notification.id));
        removeError(notification.id);
      }, 5000)
    );

    return () => timers.forEach(clearTimeout);
  }, [errors, removeError]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2">
      {visible.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm animate-slide-in ${
            notification.severity === "error"
              ? "bg-red-900/90 border-red-700 text-red-100"
              : notification.severity === "warning"
              ? "bg-yellow-900/90 border-yellow-700 text-yellow-100"
              : "bg-blue-900/90 border-blue-700 text-blue-100"
          }`}
        >
          <div className="flex-1 text-sm">{notification.message}</div>
          <button
            onClick={() => {
              setVisible((prev) => prev.filter((n) => n.id !== notification.id));
              removeError(notification.id);
            }}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
