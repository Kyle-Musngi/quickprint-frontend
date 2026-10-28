import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ArrowRight,
  CheckCheck,
  ChevronDown,
  LayoutDashboard,
  Package,
  Settings,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRoleLabel } from '../../utils/formatRoleLabel';
import './Navbar.css';

export function resolveNotificationLink(link, userRole) {
  if (!link) {
    return userRole === 'customer' ? '/customer/dashboard' : '/shop/dashboard';
  }
  const target = String(link).trim();
  if (userRole === 'shop_owner' || userRole === 'shop_staff') {
    if (target.startsWith('/shop/reviews')) {
      return '/shop/dashboard?tab=reviews';
    }
    if (target === '/shop/registration') {
      return '/shop-registration';
    }
    if (target.startsWith('/tracking/')) {
      return '/shop/orders';
    }
  }
  if (userRole === 'admin') {
    if (target.startsWith('/admin/shops/')) {
      return '/admin/approvals';
    }
  }
  if (userRole === 'customer') {
    if (target === '/shop/registration' || target === '/shop-registration') {
      return '/customer/dashboard';
    }
  }
  return target;
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const closeMobile = () => setMobileOpen(false);

  const handleHowItWorksClick = (e) => {
    e.preventDefault();
    closeMobile();
    if (location.pathname === '/') {
      const el = document.getElementById('how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#how-it-works');
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMobile} aria-label="Univ Quick Print Home">
          <img
            src="/images/uqp-logo.png"
            alt="Univ Quick Print Logo"
            className="navbar-brand-logo"
          />
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">Univ <span>Quick Print</span></span>
            <span className="navbar-brand-sub">Campus Printing Made Simple</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav>
          <ul className="navbar-links">
            <li>
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/shops" className={`navbar-link ${location.pathname.startsWith('/shops') ? 'active' : ''}`}>
                Find Printing Shops
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleHowItWorksClick}
                className="navbar-link"
              >
                How It Works
              </button>
            </li>
            {!user && (
              <li>
                <Link to="/shop-registration" className={`navbar-link ${location.pathname === '/shop-registration' ? 'active' : ''}`}>
                  Shop Registration
                </Link>
              </li>
            )}

            {/* Role specific primary links */}
            {user && user.role === 'customer' && (
              <li>
                <Link to="/customer/dashboard" className={`navbar-link ${location.pathname === '/customer/dashboard' ? 'active' : ''}`}>
                  My Dashboard
                </Link>
              </li>
            )}
            {user && (user.role === 'shop_owner' || user.role === 'shop_staff') && (
              <li>
                <Link to="/shop/dashboard" className={`navbar-link ${location.pathname.startsWith('/shop/') ? 'active' : ''}`}>
                  Shop Portal
                </Link>
              </li>
            )}
            {user && (user.role === 'admin' || user.is_superuser) && (
              <li>
                <Link to="/admin/dashboard" className={`navbar-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Notifications Popover */}
              <div className="notification-control" ref={notificationRef}>
                <button
                  type="button"
                  className="navbar-notification-btn"
                  title="Notifications"
                  aria-label="Open notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className="notification-popover" role="dialog" aria-label="Notifications">
                    <div className="notification-popover-header">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <button type="button" onClick={markAllRead} className="notification-mark-all">
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      <div className="notification-popover-list">
                        {notifications.slice(0, 6).map((notification) => (
                          <div key={notification.id} className={`notification-popover-item ${notification.is_read ? '' : 'unread'}`}>
                            <div>
                              <strong>{notification.title}</strong>
                              <p>{notification.message}</p>
                              <time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time>
                            </div>
                            <div className="notification-popover-actions">
                              {notification.link && (
                                <Link
                                  to={resolveNotificationLink(notification.link, user?.role)}
                                  onClick={() => { markRead(notification.id); setNotificationsOpen(false); }}
                                >
                                  View <ArrowRight size={13} />
                                </Link>
                              )}
                              {!notification.is_read && (
                                <button type="button" onClick={() => markRead(notification.id)}>Mark read</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link
                      to={user.role === 'customer' ? '/customer/notifications' : '/shop/dashboard'}
                      className="notification-view-all"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      {user.role === 'customer' ? 'View all notifications' : 'View notifications in Shop Portal'}
                    </Link>
                  </div>
                )}
              </div>

              {/* Customer Account Dropdown */}
              <div className="user-dropdown-control" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-profile-btn"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Account options menu"
                >
                  <UserIcon size={16} />
                  <span className="user-display-name">{user.first_name || user.username}</span>
                  <span className="role-tag">{formatRoleLabel(user.role)}</span>
                  <ChevronDown size={14} className={`dropdown-chevron ${userMenuOpen ? 'open' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown-menu" role="menu" aria-label="Account menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-avatar">
                        {user.first_name ? user.first_name[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : 'U')}
                      </div>
                      <div className="user-dropdown-meta">
                        <strong className="user-meta-name">{user.full_name || user.username}</strong>
                        <span className="user-meta-email">{user.email || `@${user.username}`}</span>
                        <span className="user-meta-role">{formatRoleLabel(user.role)}</span>
                      </div>
                    </div>

                    <div className="user-dropdown-divider" />

                    {user.role === 'customer' ? (
                      <>
                        <Link
                          to="/customer/profile"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon size={16} />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/customer/dashboard"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard size={16} />
                          <span>My Dashboard</span>
                        </Link>
                        <Link
                          to="/customer/orders"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Package size={16} />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/shop-registration"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          style={{ color: 'var(--primary-blue)', fontWeight: 600 }}
                        >
                          <Store size={16} />
                          <span>Become a Shop Owner</span>
                        </Link>
                      </>
                    ) : (user.role === 'shop_owner' || user.role === 'shop_staff') ? (
                      <>
                        <Link
                          to="/shop/dashboard"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard size={16} />
                          <span>Shop Portal</span>
                        </Link>
                        <Link
                          to="/shop/settings"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          <span>Shop Settings</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/admin/dashboard"
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard size={16} />
                          <span>Admin Dashboard</span>
                        </Link>
                      </>
                    )}

                    <div className="user-dropdown-divider" />

                    <button
                      type="button"
                      className="user-dropdown-item logout-item"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav-outline">
                Log In
              </Link>
              <Link to="/signup" className="btn-nav-outline">
                Sign Up
              </Link>
              <Link to="/shops" className="btn-nav-primary">
                Print Now
              </Link>
            </>
          )}

          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="mobile-nav open">
          <Link to="/" className="navbar-link" onClick={closeMobile}>Home</Link>
          <Link to="/shops" className="navbar-link" onClick={closeMobile}>Find Printing Shops</Link>
          <button type="button" className="navbar-link" style={{ textAlign: 'left', width: '100%' }} onClick={handleHowItWorksClick}>How It Works</button>
          {!user && (
            <Link to="/shop-registration" className="navbar-link" onClick={closeMobile}>Shop Owner Registration</Link>
          )}

          {user ? (
            <>
              {user.role === 'customer' && (
                <div className="mobile-user-nav-block">
                  <div className="mobile-user-badge">
                    <UserIcon size={16} />
                    <span>{user.full_name || user.username}</span>
                    <span className="role-tag">{formatRoleLabel(user.role)}</span>
                  </div>
                  <Link to="/customer/dashboard" className="navbar-link" onClick={closeMobile}>My Dashboard</Link>
                  <Link to="/customer/orders" className="navbar-link" onClick={closeMobile}>My Orders</Link>
                  <Link to="/customer/profile" className="navbar-link" onClick={closeMobile}>Profile</Link>
                  <Link to="/customer/notifications" className="navbar-link" onClick={closeMobile}>
                    Notifications ({unreadCount})
                  </Link>
                  <Link to="/shop-registration" className="navbar-link" onClick={closeMobile} style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
                    Become a Shop Owner
                  </Link>
                </div>
              )}
              {(user.role === 'shop_owner' || user.role === 'shop_staff') && (
                <>
                  <Link to="/shop/dashboard" className="navbar-link" onClick={closeMobile}>Shop Dashboard</Link>
                  <Link to="/shop/settings" className="navbar-link" onClick={closeMobile}>Shop Settings</Link>
                </>
              )}
              {(user.role === 'admin' || user.is_superuser) && (
                <>
                  <Link to="/admin/dashboard" className="navbar-link" onClick={closeMobile}>Admin Dashboard</Link>
                  <Link to="/admin/approvals" className="navbar-link" onClick={closeMobile}>Pending Shop Approvals</Link>
                </>
              )}
              <button onClick={handleLogout} className="btn-nav-outline" style={{ marginTop: '0.5rem', width: '100%' }}>
                <LogOut size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Log Out ({user.username})
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn-nav-outline" onClick={closeMobile}>Log In</Link>
              <Link to="/signup" className="btn-nav-outline" onClick={closeMobile}>Sign Up</Link>
              <Link to="/shops" className="btn-nav-primary" onClick={closeMobile}>Print Now</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
