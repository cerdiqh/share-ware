import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [ratingInfo, setRatingInfo] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user || !user.token) { setLoading(false); return; }
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await api.get('/api/users/profile', config);
        setForm({ fullname: data.fullname || '', email: data.email || '', phone: data.phone || '', address: data.address || '' });
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    load();
    const loadRatings = async () => {
      if (!user || !user._id || user.role !== 'donor') return;
      try {
        const { data } = await api.get(`/api/ratings/donor/${user._id}`);
        setRatingInfo(data);
      } catch (err) { console.error(err); }
    };
    loadRatings();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.put('/api/users/profile', form, config);
      // update context with returned data
      login({ ...user, ...data, token: user.token });
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      {ratingInfo && (
        <div className="mb-4">
          <div className="text-sm text-gray-600">Average rating: <strong>{ratingInfo.average ? ratingInfo.average.toFixed(1) : '0.0'}</strong> ({ratingInfo.count} reviews)</div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input className="w-full border rounded px-3 py-2" value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input className="w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input className="w-full border rounded px-3 py-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Profile</button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
