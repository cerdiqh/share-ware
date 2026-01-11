import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/api/notifications', config);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/notifications/${id}/read`, {}, config);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
      <div className="bg-white rounded shadow">
        {notifications.length === 0 && (
          <div className="p-4 text-gray-600">No notifications</div>
        )}
        {notifications.map(n => (
          <div key={n._id} className={`p-4 border-b flex justify-between ${n.read ? 'bg-gray-50' : 'bg-white'}`}>
            <div>
              <div className="font-medium">{n.title}</div>
              <div className="text-sm text-gray-700">{n.body}</div>
              {n.link && <a href={n.link} className="text-xs text-blue-600">Open</a>}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
              {!n.read && <button onClick={() => markRead(n._id)} className="mt-2 text-xs text-blue-600">Mark as read</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
