import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import DonationCard from '../components/DonationCard';

const SavedPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const fetchSaved = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/api/users/saved', config);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load saved items', err);
    }
  };

  useEffect(() => { fetchSaved(); }, [user]);

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-4">Saved Items</h2>
      {items.length === 0 ? (
        <div className="p-4 text-gray-600">No saved items yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(d => (
            <DonationCard key={d._id} donation={d} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
