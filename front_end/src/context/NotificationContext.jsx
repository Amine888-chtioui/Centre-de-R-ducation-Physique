import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  getNotificationStreamUrl,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef(null);

  const refreshList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await getNotifications();
      setItems(list);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshCount = useCallback(async () => {
    if (!token) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      /* ignore */
    }
  }, [token]);

  const prependNotification = useCallback(
    (notification) => {
      setItems((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev].slice(0, 30);
      });
      if (!notification.read) {
        setUnreadCount((c) => c + 1);
        toast.info(notification.title, {
          icon: notification.icon || "bi-bell-fill",
          duration: 5000,
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setItems([]);
      setUnreadCount(0);
      return undefined;
    }

    refreshList();
    refreshCount();

    const url = getNotificationStreamUrl(token);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("notification", (event) => {
      try {
        const data = JSON.parse(event.data);
        prependNotification(data);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener("unread-count", (event) => {
      try {
        const count = JSON.parse(event.data);
        setUnreadCount(typeof count === "number" ? count : Number(count));
      } catch {
        /* ignore */
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, token, refreshList, refreshCount, prependNotification]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    await refreshCount();
  }, [refreshCount]);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const value = {
    items,
    unreadCount,
    loading,
    refreshList,
    markRead,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications doit être utilisé dans NotificationProvider");
  }
  return ctx;
}
