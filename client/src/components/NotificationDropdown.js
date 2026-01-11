import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL = 30000; // 30s

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const mounted = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/api/notifications', config);
      if (mounted.current) setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user]);

  useEffect(() => {
    mounted.current = true;
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => { mounted.current = false; clearInterval(id); };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/notifications/${id}/read`, {}, config);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('mark read failed', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 hover:bg-gray-700 rounded"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-xs text-white rounded-full px-1">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded shadow-lg z-50">
          <div className="p-2 border-b font-semibold">Notifications</div>
          <div className="max-h-64 overflow-auto">
            {notifications.length === 0 && (
              <div className="p-3 text-sm text-gray-600">No notifications</div>
            )}
            {notifications.map(n => (
              <div key={n._id} className={`p-3 border-b flex justify-between items-start ${n.read ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-gray-600">{n.body}</div>
                  {n.link && <Link to={n.link} className="text-xs text-blue-600">Open</Link>}
                </div>
                {!n.read && (
                  <button onClick={() => markAsRead(n._id)} className="ml-2 text-xs text-blue-600">Mark</button>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 border-t text-center text-xs text-gray-600">
            <Link to="/notifications" className="text-blue-600">View all</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
