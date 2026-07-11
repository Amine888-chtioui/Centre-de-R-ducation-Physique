import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdmin } from "../../utils/auth";
import NotificationBell from "../notifications/NotificationBell";
import "./dashboard.css";

export default function DashboardLayout({
  children,
  navItems,
  activeTab,
  onTabChange,
  title,
  subtitle,
  simple = false,
  onNotificationNavigate,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const admin = isAdmin(user);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleTab = (id) => {
    onTabChange(id);
    setSidebarOpen(false);
  };

  return (
    <div
      className={`dash ${admin ? "dash--admin" : "dash--user"} ${simple ? "dash--simple" : ""}`}
    >
      {sidebarOpen && (
        <button
          type="button"
          className="dash-overlay"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`dash-sidebar ${sidebarOpen ? "dash-sidebar--open" : ""}`}
        aria-label="Navigation"
      >
        <Link to="/" className="dash-brand" onClick={() => setSidebarOpen(false)}>
          <span className="dash-brand__icon">
            <i className="bi bi-person-arms-up" aria-hidden="true" />
          </span>
          <span className="dash-brand__text">
            <strong>Mon espace</strong>
            <small>Centre de rééducation</small>
          </span>
        </Link>

        <nav className="dash-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dash-nav__item ${activeTab === item.id ? "dash-nav__item--active" : ""}`}
              onClick={() => handleTab(item.id)}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar__footer">
          <Link to="/" className="dash-nav__item dash-nav__item--link">
            <i className="bi bi-house" aria-hidden="true" />
            <span>Retour au site</span>
          </Link>
          <button
            type="button"
            className="dash-nav__item dash-nav__item--danger"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-menu-btn"
            aria-label="Menu"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>

          <div className="dash-topbar__titles">
            <h1 className="dash-topbar__title">{title}</h1>
            {subtitle && !simple && (
              <p className="dash-topbar__subtitle">{subtitle}</p>
            )}
          </div>

          <div className="dash-topbar__actions">
            <NotificationBell onNavigate={onNotificationNavigate} />
            {!simple && (
              <div className="dash-user-chip">
                <span className="dash-user-chip__avatar" aria-hidden="true">
                  {(user?.prenom?.[0] || "") + (user?.nom?.[0] || "")}
                </span>
                <span className="dash-user-chip__info">
                  <strong>
                    {user?.prenom} {user?.nom}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="dash-content">
          <div key={activeTab} className="dash-view dash-view--enter">
            {children}
          </div>
        </div>
      </div>

      <nav className="dash-bottom-nav" aria-label="Navigation mobile">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`dash-bottom-nav__item ${activeTab === item.id ? "dash-bottom-nav__item--active" : ""}`}
            onClick={() => handleTab(item.id)}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.shortLabel || item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
