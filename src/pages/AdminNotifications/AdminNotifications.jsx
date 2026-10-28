import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Bell,
  CheckCheck,
  RotateCcw,
  Store,
  DollarSign,
  Package,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { resolveNotificationLink } from '../../components/Navbar/Navbar';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const { notifications, unreadCount, markRead, markAllRead, fetchNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'registrations', 'orders'
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const isRegistrationNotif = (n) => {
    const text = `${n.title || ''} ${n.message || ''} ${n.link || ''}`.toLowerCase();
    return text.includes('registration') || text.includes('shop') || text.includes('approval');
  };

  const isRefundOrOrderNotif = (n) => {
    const text = `${n.title || ''} ${n.message || ''} ${n.link || ''}`.toLowerCase();
    return text.includes('order') || text.includes('refund') || text.includes('payment');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'registrations') return isRegistrationNotif(n);
    if (activeTab === 'orders') return isRefundOrOrderNotif(n);
    return true;
  });

  const getNotifIcon = (notif) => {
    if (isRegistrationNotif(notif)) {
      return <Store size={18} style={{ color: '#2563EB' }} />;
    }
    if (isRefundOrOrderNotif(notif)) {
      return <DollarSign size={18} style={{ color: '#D97706' }} />;
    }
    return <Bell size={18} style={{ color: '#64748B' }} />;
  };

  return (
    <div className="admin-notifications-page">
      <div className="admin-notif-nav-bar">
        <Link to="/admin/dashboard" className="btn-admin-back">
          <ArrowLeft size={16} /> Back to Overview
        </Link>
      </div>

      <div className="admin-notif-header">
        <div className="admin-notif-header-left">
          <div className="admin-notif-icon-box">
            <Shield size={26} />
          </div>
          <div>
            <h1 className="admin-notif-title">Admin Notifications</h1>
            <p className="admin-notif-sub">
              System-wide administrative alerts, new shop registrations, and operational updates.
            </p>
          </div>
        </div>

        <div className="admin-notif-actions">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-admin-outline"
            title="Refresh notifications"
          >
            <RotateCcw size={15} className={refreshing ? 'spin-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="btn-admin-mark-all"
              title="Mark all notifications as read"
            >
              <CheckCheck size={16} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-notif-tabs">
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          Shop Registrations
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Refunds & Orders
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="admin-notif-empty">
          <div className="empty-icon-circle">
            <Bell size={32} />
          </div>
          <h3>No notifications found</h3>
          <p>
            {activeTab === 'unread'
              ? "You have no unread notifications right now. You're all caught up!"
              : activeTab === 'registrations'
              ? 'No new shop registration notifications have been received.'
              : 'There are no administrative alerts for this category.'}
          </p>
        </div>
      ) : (
        <div className="admin-notif-list">
          {filteredNotifications.map((notif) => {
            const destination = resolveNotificationLink(notif.link, 'admin');
            const hasLink = Boolean(notif.link);

            return (
              <div
                key={notif.id}
                className={`admin-notif-card ${!notif.is_read ? 'unread' : ''}`}
              >
                <div className="notif-card-icon">
                  {getNotifIcon(notif)}
                </div>

                <div className="notif-card-body">
                  <div className="notif-card-top">
                    <h3 className="notif-card-title">{notif.title}</h3>
                    <span className="notif-card-time">
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="notif-card-message">{notif.message}</p>

                  <div className="notif-card-footer">
                    {hasLink ? (
                      <Link
                        to={destination}
                        className="btn-notif-view"
                        onClick={() => markRead(notif.id)}
                      >
                        <span>{isRegistrationNotif(notif) ? 'Review Application' : 'View Details'}</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <span className="notif-no-action">System Alert</span>
                    )}

                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={() => markRead(notif.id)}
                        className="btn-notif-mark-single"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
