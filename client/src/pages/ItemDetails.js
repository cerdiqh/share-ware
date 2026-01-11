import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/donations/${id}`);
        setDonation(data);
        console.debug('Loaded donation detail:', { id: data._id, imagePath: data.imagePath, images: data.images });
      } catch (err) {
        console.error('Failed to load donation', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  const refresh = async () => {
    try {
      const { data } = await api.get(`/api/donations/${id}`);
      setDonation(data);
    } catch (err) { console.error(err); }
  };

  const handleRequest = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/donations/${id}/request`, {}, config);
      await refresh();
      alert('Request sent to donor.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Request failed');
    } finally { setBusy(false); }
  };

  const handleCancel = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/donations/${id}/cancel`, {}, config);
      await refresh();
      alert('Request cancelled.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Cancel failed');
    } finally { setBusy(false); }
  };

  const handleApprove = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/donations/${id}/approve`, {}, config);
      await refresh();
      alert('Request approved.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Approve failed');
    } finally { setBusy(false); }
  };

  const handleReject = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/donations/${id}/reject`, {}, config);
      await refresh();
      alert('Request rejected.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Reject failed');
    } finally { setBusy(false); }
  };

  const handleComplete = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/donations/${id}/complete`, {}, config);
      await refresh();
      alert('Marked as picked up.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Complete failed');
    } finally { setBusy(false); }
  };

  // Ratings
  useEffect(() => {
    const loadRatings = async () => {
      if (!donation) return;
      try {
        const { data } = await api.get(`/api/ratings/donation/${donation._id}`);
        const mine = data.find(r => r.rater && r.rater._id === (user && user._id));
        setMyRating(mine || null);
      } catch (err) {
        // ignore
      }
    };
    loadRatings();
  }, [donation, user]);

  const submitRating = async () => {
    if (!user) return navigate('/login');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.post('/api/ratings', { donationId: donation._id, stars: ratingStars, comment: ratingComment }, config);
      alert('Thank you for your rating');
      setMyRating({ stars: ratingStars, comment: ratingComment });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to submit rating');
    }
  };

  // Propose pickup slot (recipient)
  const [slotTime, setSlotTime] = useState('');
  const [slotMessage, setSlotMessage] = useState('');
  const [slotBusy, setSlotBusy] = useState(false);

  const proposeSlot = async () => {
    if (!user) return navigate('/login');
    if (!slotTime) return alert('Please choose a date and time');
    setSlotBusy(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.post('/api/slots/propose', { donationId: id, proposedTime: slotTime, message: slotMessage }, config);
      alert('Pickup slot proposed. The donor will be notified.');
      setSlotTime(''); setSlotMessage('');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to propose slot');
    } finally { setSlotBusy(false); }
  };

  if (loading) return <div className="p-8 text-center">Loading item...</div>;
  if (!donation) return <div className="p-8 text-center text-red-500">Item not found.</div>;

  const isDonor = user && donation.donor && user._id === donation.donor._id;
  const isRequester = user && donation.requestedBy && user._id === (donation.requestedBy._id || donation.requestedBy);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 bg-gray-100 p-4 flex items-center justify-center">
            {donation.images && donation.images.length > 0 ? (
              <Gallery images={donation.images} title={donation.title} />
            ) : donation.imagePath ? (
              <img src={donation.imagePath.startsWith('http') ? donation.imagePath : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${donation.imagePath}`} alt={donation.title} className="max-h-96 object-contain" />
            ) : (
              <div className="h-64 w-full bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
            )}
          </div>
          <div className="md:w-1/2 p-6">
            <h1 className="text-2xl font-extrabold mb-2">{donation.title}</h1>
            <p className="text-gray-600 mb-4">{donation.description}</p>
            <p className="text-sm text-gray-500 mb-2">Category: {donation.category} • Condition: {donation.condition}</p>
            <div className="mb-4">
              <h3 className="font-semibold">Donor</h3>
              <p className="text-sm text-gray-700">{donation.donor ? donation.donor.fullname : 'Anonymous'}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Status</h3>
              <p className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700">{donation.status}</p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              {/* Recipient actions */}
              {!user && (
                <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-4 py-2 rounded">Sign in to request</button>
              )}

              {user && !isDonor && donation.status === 'available' && (
                <button onClick={handleRequest} disabled={busy} className="bg-green-600 text-white px-4 py-2 rounded">{busy ? 'Requesting...' : 'Request this item'}</button>
              )}

              {user && !isDonor && (
                <button onClick={async () => {
                  try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const resp = await api.post(`/api/conversations/for-donation/${id}`, {}, config);
                    const conv = resp.data;
                    // navigate to conversation
                    navigate(`/conversations/${conv._id}`);
                  } catch (err) {
                    console.error(err);
                    alert('Failed to start conversation');
                  }
                }} className="bg-gray-600 text-white px-4 py-2 rounded">Message donor</button>
              )}

              {user && isRequester && (donation.status === 'requested' || donation.status === 'approved') && (
                <button onClick={handleCancel} disabled={busy} className="bg-yellow-500 text-white px-4 py-2 rounded">{busy ? 'Cancelling...' : 'Cancel Request'}</button>
              )}

              {/* Donor actions */}
              {user && isDonor && donation.status === 'requested' && (
                <div className="flex gap-2">
                  <button onClick={handleApprove} disabled={busy} className="bg-blue-600 text-white px-4 py-2 rounded">Approve</button>
                  <button onClick={handleReject} disabled={busy} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
                </div>
              )}

              {user && isDonor && donation.status === 'approved' && (
                <button onClick={handleComplete} disabled={busy} className="bg-indigo-600 text-white px-4 py-2 rounded">Mark as Picked Up</button>
              )}
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <h4 className="font-semibold">Pickup Instructions</h4>
              <p>Contact the donor to arrange pickup. Share a phone number or coordinate via messages.</p>
            </div>

            {/* Propose pickup slot (recipient) */}
            {user && !isDonor && (
              <div className="mt-6 p-4 border rounded bg-gray-50">
                <h4 className="font-semibold mb-2">Propose a pickup time</h4>
                <input type="datetime-local" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className="border rounded px-3 py-2 w-full mb-2" />
                <textarea value={slotMessage} onChange={(e) => setSlotMessage(e.target.value)} placeholder="Optional message" className="border rounded px-3 py-2 w-full mb-2" />
                <div className="flex gap-2">
                  <button onClick={proposeSlot} disabled={slotBusy} className="bg-yellow-500 text-white px-4 py-2 rounded">{slotBusy ? 'Proposing...' : 'Propose pickup'}</button>
                </div>
              </div>
            )}

            {/* Rating section for requester after pickup */}
            {user && isRequester && donation.status === 'donated' && (
              <div className="mt-6 p-4 border rounded bg-white">
                <h4 className="font-semibold mb-2">Rate this donation</h4>
                {myRating ? (
                  <div className="text-sm">You rated this donation: {myRating.stars} / 5<br />{myRating.comment}</div>
                ) : (
                  <div>
                    <label className="block text-sm mb-1">Stars</label>
                    <select value={ratingStars} onChange={(e) => setRatingStars(Number(e.target.value))} className="border rounded px-2 py-1 mb-2">
                      <option value={5}>5</option>
                      <option value={4}>4</option>
                      <option value={3}>3</option>
                      <option value={2}>2</option>
                      <option value={1}>1</option>
                    </select>
                    <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Optional comment" className="border rounded px-3 py-2 w-full mb-2" />
                    <button onClick={submitRating} className="bg-indigo-600 text-white px-4 py-2 rounded">Submit rating</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;

function Gallery({ images, title }) {
  const [main, setMain] = useState(images[0].image || images[0]);
  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-3">
        <img src={main.startsWith('http') ? main : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${main}`} alt={title} className="max-h-96 object-contain" />
      </div>
      <div className="flex gap-2 overflow-auto">
        {images.map((img, idx) => {
          const thumb = img.thumbnail || img.image || img;
          const src = thumb.startsWith('http') ? thumb : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${thumb}`;
          const full = (img.image || img).startsWith('http') ? (img.image || img) : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${img.image || img}`;
          return (
            <button key={idx} onClick={() => setMain(full)} className="flex-shrink-0 border rounded overflow-hidden">
              <img src={src} alt={`thumb-${idx}`} className="w-20 h-20 object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
