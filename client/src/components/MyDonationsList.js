import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const MyDonationsList = () => {
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMyDonations = async () => {
      if (!user || !user.token) return;
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await api.get('/api/donations/mydonations', config);
        setMyDonations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch your donations.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyDonations();
  }, [user]);

  if (loading) return <p className="text-center mt-4">Loading your donations...</p>;
  if (error) return <p className="text-center text-red-500 mt-4">{error}</p>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">My Donation History</h2>
      {myDonations.length === 0 ? (
        <p className="text-gray-500">You have not made any donations yet.</p>
      ) : (
        <ul className="space-y-4">
          {myDonations.map((donation) => (
            <li key={donation._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <h3 className="font-bold">{donation.title}</h3>
                <p className="text-sm text-gray-600">{donation.description}</p>
                {donation.requestedBy && (
                  <p className="text-sm text-gray-500">Requested by: {donation.requestedBy.fullname || donation.requestedBy}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    donation.status === 'available' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {donation.status}
                </span>

                {donation.status === 'requested' && donation.requestedBy && (
                  <ApproveButton donation={donation} onApproved={(updated) => {
                    setMyDonations((prev) => prev.map(d => d._id === updated._id ? updated : d));
                  }} />
                )}
                <ViewProposals donationId={donation._id} token={user?.token} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ApproveButton = ({ donation, onApproved }) => {
  const { user } = useAuth();

  const handleApprove = async () => {
    if (!user || !user.token) return alert('You must be logged in.');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.put(`/api/donations/${donation._id}/approve`, {}, config);
      alert('Request approved.');
      if (onApproved) onApproved(data);
    } catch (err) {
      console.error('Approve failed', err);
      alert(err?.response?.data?.message || 'Failed to approve request');
    }
  };

  return (
    <button onClick={handleApprove} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded">
      Approve
    </button>
  );
};

export default MyDonationsList;

// Small component to view and act on pickup proposals for a donation
function ViewProposals({ donationId, token }) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await api.get(`/api/slots/donation/${donationId}`, config);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load slots', err);
    } finally { setLoading(false); }
  };

  const accept = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await api.put(`/api/slots/${id}/accept`, {}, config);
      setSlots(prev => prev.map(s => s._id === data._id ? data : s));
    } catch (err) { console.error(err); }
  };

  const confirm = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await api.put(`/api/slots/${id}/confirm`, {}, config);
      setSlots(prev => prev.map(s => s._id === data._id ? data : s));
    } catch (err) { console.error(err); }
  };

  const cancel = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/api/slots/${id}`, config);
      setSlots(prev => prev.filter(s => s._id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <button onClick={() => { setOpen(o => !o); if (!open) fetchSlots(); }} className="bg-gray-200 px-3 py-1 rounded">{open ? 'Hide Proposals' : 'View Proposals'}</button>
      {open && (
        <div className="mt-3 w-96 bg-white p-3 rounded shadow">
          {loading && <div>Loading...</div>}
          {!loading && slots.length === 0 && <div className="text-sm text-gray-500">No proposals yet.</div>}
          {slots.map(s => (
            <div key={s._id} className="border-b py-2">
              <div className="text-sm font-medium">{s.proposer.fullname}</div>
              <div className="text-xs text-gray-600">{new Date(s.proposedTime).toLocaleString()}</div>
              {s.message && <div className="text-xs text-gray-700">{s.message}</div>}
              <div className="mt-2 flex gap-2">
                {s.status === 'proposed' && <button onClick={() => accept(s._id)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Accept</button>}
                {s.status === 'accepted' && <button onClick={() => confirm(s._id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Confirm</button>}
                <button onClick={() => cancel(s._id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
