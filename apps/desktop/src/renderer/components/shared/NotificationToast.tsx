import { useEffect, useState } from "react";
import { useErrorStore } from "../../stores/error.store";
import { Alert, AlertDescription, Button } from "../ui";
import { XIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  severity: "error" | "warning" | "info";
}

const severityIcons = {
  error: <AlertCircleIcon className="w-4 h-4" />,
  warning: <AlertTriangleIcon className="w-4 h-4" />,
  info: <InfoIcon className="w-4 h-4" />,
};

const severityVariants = {
  error: "destructive" as const,
  warning: "warning" as const,
  info: "info" as const,
};

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
    <div className="fixed bottom-16 right-4 z-toast flex flex-col gap-2">
      {visible.map((notification) => (
        <Alert
          key={notification.id}
          variant={severityVariants[notification.severity]}
          className="w-80 animate-slide-in"
        >
          {severityIcons[notification.severity]}
          <AlertDescription className="flex-1 text-sm">{notification.message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setVisible((prev) => prev.filter((n) => n.id !== notification.id));
              removeError(notification.id);
            }}
            className="h-6 w-6"
          >
            <XIcon className="w-3 h-3" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
