import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "../../context/NotificationContext";
import LoadingSpinner from "../ui/LoadingSpinner";
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

function dayLabel(iso) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays <= 6) return "Cette semaine";
  return "Plus tôt";
}

function groupByDay(list) {
  const groups = [];
  for (const item of list) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
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

    // Dans les deux cas (gauche ou droite), on supprime définitivement en BDD
    setTimeout(() => {
      onDismiss(item.id);
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
        <i className="bi bi-trash-fill"></i>
      </div>
      <div
        className={`notif-item-swipe-bg notif-item-swipe-bg--right ${isDraggingRight && bgVisible ? "notif-item-swipe-bg--visible" : ""}`}
        aria-hidden="true"
      >
        <i className="bi bi-trash-fill"></i>
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

export default function NotificationBell({ onNavigate }) {
  const {
    items,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteItem,
    deleteAll,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const prevUnreadRef = useRef(unreadCount);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_MQ).matches
      : false,
  );
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  const closePanel = () => {
    setOpen(false);
    setMenuOpen(false);
  };

  const toggleOpen = () => {
    if (open) {
      closePanel();
    } else {
      setFilter("all");
      setOpen(true);
    }
  };

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
        closePanel();
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") closePanel();
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

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const handleDeleteAll = () => {
    if (!window.confirm("Supprimer toutes les notifications ?")) return;
    deleteAll();
  };

  const handleItemRead = async (id, navigate) => {
    const item = items.find((n) => n.id === id);
    if (item && !item.read) {
      await markRead(id);
    }
    if (navigate) {
      closePanel();
      if (item?.targetTab && onNavigate) {
        onNavigate(item.targetTab);
      }
    }
  };

  const filteredItems =
    isMobile && filter === "unread" ? items.filter((i) => !i.read) : items;
  const dayGroups = isMobile ? groupByDay(filteredItems) : [];

  const panel = open ? (
    <>
      <button
        type="button"
        className="notif-bell__backdrop"
        aria-label="Fermer les notifications"
        onClick={closePanel}
      />
      <div
        id="notif-panel-root"
        className={`notif-panel${isMobile ? " notif-panel--sheet" : ""}`}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        <header className="notif-panel__header">
          {isMobile && (
            <button
              type="button"
              className="notif-panel__back"
              aria-label="Retour"
              onClick={closePanel}
            >
              <i className="bi bi-arrow-left" aria-hidden="true" />
            </button>
          )}
          <h2 className="notif-panel__title">Notifications</h2>

          {isMobile ? (
            (unreadCount > 0 || items.length > 0) && (
              <div className="notif-panel__menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="notif-panel__menu-btn"
                  aria-label="Options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <i className="bi bi-three-dots-vertical" aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div className="notif-panel__menu" role="menu">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        role="menuitem"
                        className="notif-panel__menu-item"
                        onClick={() => {
                          markAllRead();
                          setMenuOpen(false);
                        }}
                      >
                        <i className="bi bi-check2-all" aria-hidden="true" />
                        Tout marquer lu
                      </button>
                    )}
                    {items.length > 0 && (
                      <button
                        type="button"
                        role="menuitem"
                        className="notif-panel__menu-item notif-panel__menu-item--danger"
                        onClick={() => {
                          setMenuOpen(false);
                          handleDeleteAll();
                        }}
                      >
                        <i className="bi bi-trash3" aria-hidden="true" />
                        Tout supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="notif-panel__actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-panel__action"
                  onClick={() => markAllRead()}
                >
                  Tout marquer lu
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  className="notif-panel__action notif-panel__action--danger"
                  onClick={handleDeleteAll}
                >
                  Tout supprimer
                </button>
              )}
            </div>
          )}
        </header>

        {isMobile && items.length > 0 && (
          <div className="notif-panel__pills">
            <button
              type="button"
              className={`notif-pill${filter === "all" ? " notif-pill--active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Toutes<span className="notif-pill__count">{items.length}</span>
            </button>
            <button
              type="button"
              className={`notif-pill${filter === "unread" ? " notif-pill--active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Non lues<span className="notif-pill__count">{unreadCount}</span>
            </button>
          </div>
        )}

        <div className="notif-panel__body">
          {loading && items.length === 0 && (
            <LoadingSpinner text="Chargement…" />
          )}
          {!loading && items.length === 0 && (
            <div className="notif-panel__empty-state">
              <i className="bi bi-bell-slash" aria-hidden="true" />
              <p>Aucune notification pour le moment</p>
              <span>Les alertes apparaîtront ici en direct</span>
            </div>
          )}
          {!loading && items.length > 0 && filteredItems.length === 0 && (
            <div className="notif-panel__empty-state">
              <i className="bi bi-check2-circle" aria-hidden="true" />
              <p>Tout est lu</p>
              <span>Vous n'avez aucune notification non lue</span>
            </div>
          )}

          {isMobile ? (
            dayGroups.map((group) => (
              <div className="notif-day-group" key={group.label}>
                <div className="notif-day-label">{group.label}</div>
                <ul className="notif-list">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <SwipeableNotifItem
                        item={item}
                        onRead={(id) => handleItemRead(id, false)}
                        onDismiss={deleteItem}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <ul className="notif-list">
              {items.map((item) => (
                <li key={item.id}>
                  <SwipeableNotifItem
                    item={item}
                    onRead={(id) => handleItemRead(id, false)}
                    onDismiss={deleteItem}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
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
        onClick={toggleOpen}
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
