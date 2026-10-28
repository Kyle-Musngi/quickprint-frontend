import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Bell,
  CheckCheck,
  RotateCcw,
  Package,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Clock,
  Printer
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { resolveNotificationLink } from '../../components/Navbar/Navbar';
import './ShopNotifications.css';

const ShopNotifications = () => {
  const { notifications, unreadCount, markRead, markAllRead, fetchNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'orders', 'payments'
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

  const isOrderNotif = (n) => {
    const text = `${n.title || ''} ${n.message || ''} ${n.link || ''}`.toLowerCase();
    return text.includes('order') || text.includes('print') || text.includes('pickup');
  };

  const isPaymentNotif = (n) => {
    const text = `${n.title || ''} ${n.message || ''} ${n.link || ''}`.toLowerCase();
    return text.includes('payment') || text.includes('refund') || text.includes('paid');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'orders') return isOrderNotif(n);
    if (activeTab === 'payments') return isPaymentNotif(n);
    return true;
  });

  const getNotifIcon = (notif) => {
    if (isOrderNotif(notif)) {
      return <Package size={18} style={{ color: '#2563EB' }} />;
    }
    if (isPaymentNotif(notif)) {
      return <DollarSign size={18} style={{ color: '#16A34A' }} />;
    }
    return <Bell size={18} style={{ color: '#64748B' }} />;
  };

  return (
    <div className="shop-notifications-page">
      <div className="shop-notif-nav-bar">
        <Link to="/shop/dashboard" className="btn-shop-back">
          <ArrowLeft size={16} /> Back to Shop Portal
        </Link>
      </div>

      <div className="shop-notif-header">
        <div className="shop-notif-header-left">
          <div className="shop-notif-icon-box">
            <Store size={26} />
          </div>
          <div>
            <h1 className="shop-notif-title">Shop Notifications</h1>
            <p className="shop-notif-sub">
              Order updates, print queue alerts, payment confirmations, and store notifications.
            </p>
          </div>
        </div>

        <div className="shop-notif-actions">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-shop-outline"
            title="Refresh notifications"
          >
            <RotateCcw size={15} className={refreshing ? 'spin-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="btn-shop-mark-all"
              title="Mark all notifications as read"
            >
              <CheckCheck size={16} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="shop-notif-tabs">
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
          className={`notif-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders & Queue
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments & Refunds
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="shop-notif-empty">
          <div className="empty-icon-circle">
            <Bell size={32} />
          </div>
          <h3>No notifications found</h3>
          <p>
            {activeTab === 'unread'
              ? "You have no unread shop notifications right now."
              : activeTab === 'orders'
              ? 'No new order alerts or queue notifications.'
              : 'There are no notifications for this category.'}
          </p>
        </div>
      ) : (
        <div className="shop-notif-list">
          {filteredNotifications.map((notif) => {
            const destination = resolveNotificationLink(notif.link, 'shop_owner');
            const hasLink = Boolean(notif.link);

            return (
              <div
                key={notif.id}
                className={`shop-notif-card ${!notif.is_read ? 'unread' : ''}`}
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
                        className="btn-shop-notif-view"
                        onClick={() => markRead(notif.id)}
                      >
                        <span>View Details</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <span className="notif-no-action">Shop Alert</span>
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

export default ShopNotifications;
