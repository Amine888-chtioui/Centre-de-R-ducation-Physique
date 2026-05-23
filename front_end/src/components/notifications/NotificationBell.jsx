import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "../../context/NotificationContext";
import "./notifications.css";

function formatTimeAgo(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function iconTone(type) {
  switch (type) {
    case "APPOINTMENT_CONFIRMED":
      return "notif-icon--success";
    case "APPOINTMENT_REFUSED":
    case "APPOINTMENT_CANCELLED":
      return "notif-icon--danger";
    case "NEW_PATIENT":
      return "notif-icon--info";
    default:
      return "notif-icon--primary";
  }
}

const MOBILE_MQ = "(max-width: 767px)";

export default function NotificationBell({ onNavigate }) {
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(false);
  const prevUnreadRef = useRef(unreadCount);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_MQ).matches : false,
  );
  const rootRef = useRef(null);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setRing(true);
      const t = setTimeout(() => setRing(false), 1400);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
    return undefined;
  }, [unreadCount]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        const panel = document.getElementById("notif-panel-root");
        if (panel && panel.contains(e.target)) return;
        setOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    if (isMobile) {
      document.body.classList.add("notif-panel-open");
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      document.body.classList.remove("notif-panel-open");
    };
  }, [open, isMobile]);

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const handleItemClick = async (item) => {
    if (!item.read) {
      await markRead(item.id);
    }
    setOpen(false);
    if (item.targetTab && onNavigate) {
      onNavigate(item.targetTab);
    }
  };

  const panel = open ? (
    <>
      <button
        type="button"
        className="notif-bell__backdrop"
        aria-label="Fermer les notifications"
        onClick={() => setOpen(false)}
      />
      <div
        id="notif-panel-root"
        className={`notif-panel${isMobile ? " notif-panel--sheet" : ""}`}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        <header className="notif-panel__header">
          <h2 className="notif-panel__title">Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-panel__mark-all"
              onClick={() => markAllRead()}
            >
              Tout marquer lu
            </button>
          )}
        </header>

        <div className="notif-panel__body">
          {loading && items.length === 0 && (
            <p className="notif-panel__empty">Chargement…</p>
          )}
          {!loading && items.length === 0 && (
            <div className="notif-panel__empty-state">
              <i className="bi bi-bell-slash" aria-hidden="true" />
              <p>Aucune notification pour le moment</p>
              <span>Les alertes apparaîtront ici en direct</span>
            </div>
          )}
          <ul className="notif-list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`notif-item${item.read ? "" : " notif-item--unread"}`}
                  onClick={() => handleItemClick(item)}
                >
                  <span
                    className={`notif-item__icon ${iconTone(item.type)}`}
                    aria-hidden="true"
                  >
                    <i className={`bi ${item.icon || "bi-bell-fill"}`} />
                  </span>
                  <span className="notif-item__content">
                    <span className="notif-item__row">
                      <strong className="notif-item__title">{item.title}</strong>
                      <time className="notif-item__time" dateTime={item.createdAt}>
                        {formatTimeAgo(item.createdAt)}
                      </time>
                    </span>
                    <span className="notif-item__message">{item.message}</span>
                  </span>
                  {!item.read && (
                    <span className="notif-item__dot" aria-label="Non lu" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {isMobile && (
          <footer className="notif-panel__footer">
            <button
              type="button"
              className="notif-panel__close"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </footer>
        )}
      </div>
    </>
  ) : null;

  return (
    <div className="notif-bell" ref={rootRef}>
      <button
        type="button"
        className={`notif-bell__trigger${open ? " notif-bell__trigger--active" : ""}${ring ? " notif-bell__trigger--ring" : ""}`}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="bi bi-bell-fill notif-bell__icon" aria-hidden="true" />
        {badgeLabel && (
          <span className="notif-bell__badge" aria-live="polite">
            {badgeLabel}
          </span>
        )}
      </button>

      {isMobile && panel ? createPortal(panel, document.body) : panel}
    </div>
  );
}
