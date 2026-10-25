import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import './CustomerNotifications.css';

const CustomerNotifications = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="customer-notifications-page">
      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">Notifications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Stay updated with your order lifecycle, shop acceptance, and pickup alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-nav-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <Bell size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>No notifications yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            You'll receive alerts here when shops accept orders or when your prints are ready.
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
            >
              <div className="notif-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <div className="notif-time">
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {notif.link && (
                  <Link
                    to={notif.link}
                    className="view-shop-action-btn"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => markRead(notif.id)}
                  >
                    View <ArrowRight size={14} />
                  </Link>
                )}
                {!notif.is_read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
