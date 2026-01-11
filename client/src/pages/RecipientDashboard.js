import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import DonationCard from '../components/DonationCard';

const RecipientDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch available donations (public)
        const { data: availData } = await api.get('/api/donations');
        setAvailable(Array.isArray(availData) ? availData : availData.donations || []);

        // Fetch my requests (private)
        if (user && user.token) {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data: reqData } = await api.get('/api/donations/myrequests', config);
          setRequests(reqData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDonationUpdate = (updated) => {
    // Remove from available list if status changed
    setAvailable((prev) => prev.filter((d) => d._id !== updated._id));
    // Optionally refresh requests
    setRequests((prev) => {
      const exists = prev.find((r) => r._id === updated._id);
      if (exists) return prev.map((r) => (r._id === updated._id ? updated : r));
      return [updated, ...prev];
    });
  };

  if (loading) return <p>Loading your dashboard...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Recipient Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Items</h2>
        {available.length === 0 ? (
          <p className="text-gray-500">No available donations right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {available.map((donation) => (
              <DonationCard key={donation._id} donation={donation} onDonationUpdate={handleDonationUpdate} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">My Requested Items</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">You have not requested any items yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((item) => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600">From donor: {item.donor?.fullname || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">Status: {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecipientDashboard;
