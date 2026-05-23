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
const SWIPE_THRESHOLD = 80;

function SwipeableNotifItem({ item, onRead, onDismiss }) {
  const [swipeX, setSwipeX] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [swipeDir, setSwipeDir] = useState(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const itemRef = useRef(null);
  const isScrolling = useRef(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = false;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (
      !isScrolling.current &&
      Math.abs(dy) > Math.abs(dx) &&
      Math.abs(dy) > 8
    ) {
      isScrolling.current = true;
    }

    if (isScrolling.current) return;

    if (Math.abs(dx) > 6) {
      e.preventDefault();
      setSwipeX(dx);
      setSwipeDir(dx < 0 ? "left" : "right");
    }
  };

  const handleTouchEnd = () => {
    if (isScrolling.current) {
      setSwipeX(0);
      setSwipeDir(null);
      touchStartX.current = null;
      return;
    }

    if (Math.abs(swipeX) >= SWIPE_THRESHOLD) {
      triggerDismiss(swipeX < 0 ? "left" : "right");
    } else {
      setSwipeX(0);
      setSwipeDir(null);
    }
    touchStartX.current = null;
  };

  const triggerDismiss = (dir) => {
    setSwipeDir(dir);
    setSwipeX(dir === "left" ? -400 : 400);
    setIsDismissed(true);

    const wrapper = itemRef.current?.closest(".notif-item-wrapper");
    if (wrapper) {
      wrapper.classList.add("notif-item-wrapper--collapsing");
    }

    setTimeout(() => {
      if (dir === "right" && !item.read) {
        onRead(item.id);
      } else {
        onDismiss(item.id);
      }
    }, 440);
  };

  const bgVisible = Math.abs(swipeX) > 20;
  const isDraggingLeft = swipeX < 0;
  const isDraggingRight = swipeX > 0;

  return (
    <div className="notif-item-wrapper" ref={itemRef}>
      <div
        className={`notif-item-swipe-bg notif-item-swipe-bg--left ${isDraggingLeft && bgVisible ? "notif-item-swipe-bg--visible" : ""}`}
        aria-hidden="true"
      >
        <i className="bi bi-x-circle-fill"></i>
      </div>
      <div
        className={`notif-item-swipe-bg notif-item-swipe-bg--right ${isDraggingRight && bgVisible ? "notif-item-swipe-bg--visible" : ""}`}
        aria-hidden="true"
      >
        <i className="bi bi-check-circle-fill"></i>
      </div>

      <button
        type="button"
        className={`notif-item${item.read ? "" : " notif-item--unread"}${
          isDismissed
            ? swipeDir === "left"
              ? " notif-item--swiped-left"
              : " notif-item--swiped-right"
            : ""
        }`}
        style={
          !isDismissed && swipeX !== 0
            ? { transform: `translateX(${swipeX}px)`, transition: "none" }
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (Math.abs(swipeX) < 5) {
            onRead(item.id, true);
          }
        }}
        aria-label={`${item.title}${item.read ? "" : " — non lu"}`}
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
        {!item.read && <span className="notif-item__dot" aria-label="Non lu" />}
      </button>
    </div>
  );
}

const MOBILE_DISMISSED_KEY = "__notif_dismissed__";

export default function NotificationBell({ onNavigate }) {
  const { items, unreadCount, loading, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(false);
  const [dismissed, setDismissed] = useState(() => new Set());
  const prevUnreadRef = useRef(unreadCount);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_MQ).matches
      : false,
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
    if (isMobile) document.body.classList.add("notif-panel-open");

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      document.body.classList.remove("notif-panel-open");
    };
  }, [open, isMobile]);

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const handleItemRead = async (id, navigate) => {
    const item = items.find((n) => n.id === id);
    if (item && !item.read) {
      await markRead(id);
    }
    if (navigate) {
      setOpen(false);
      if (item?.targetTab && onNavigate) {
        onNavigate(item.targetTab);
      }
    }
  };

  const handleDismiss = (id) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const visibleItems = items.filter((n) => !dismissed.has(n.id));

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
          {loading && visibleItems.length === 0 && (
            <p className="notif-panel__empty">Chargement…</p>
          )}
          {!loading && visibleItems.length === 0 && (
            <div className="notif-panel__empty-state">
              <i className="bi bi-bell-slash" aria-hidden="true" />
              <p>Aucune notification pour le moment</p>
              <span>Les alertes apparaîtront ici en direct</span>
            </div>
          )}
          <ul className="notif-list">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <SwipeableNotifItem
                  item={item}
                  onRead={(id) => handleItemRead(id, false)}
                  onDismiss={handleDismiss}
                />
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
