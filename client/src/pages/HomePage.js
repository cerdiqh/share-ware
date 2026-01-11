import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';
import DonationCard from '../components/DonationCard';

const HomePage = () => {
  const [donations, setDonations] = useState([]); // always an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/donations', { params: { search } });

        // The API now returns an object { donations, page, totalPages, total }
        // Defensive extraction: support older shape (array) too.
        const list = Array.isArray(data) ? data : data.donations || [];
        setDonations(list);
        // Debug: log first few donations to inspect image fields
        if (list && list.length > 0) {
          console.debug('Fetched donations sample:', list.slice(0, 3).map(d => ({ _id: d._id, imagePath: d.imagePath, images: d.images }))); 
        }

        if (data.page) setPage(data.page);
        if (data.totalPages) setTotalPages(data.totalPages);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch donations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
    // fetch saved ids for logged in user
    const fetchSaved = async () => {
      if (!user) return;
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await api.get('/api/users/saved', config);
        const ids = Array.isArray(data) ? data.map(d => d._id) : [];
        setSavedIds(ids);
      } catch (err) {
        // ignore
      }
    };
    fetchSaved();
  }, [search]);

  if (loading) return <div className="text-center p-10"><h2>Loading donations...</h2></div>;
  if (error) return <div className="text-center p-10 text-red-500"><h2>{error}</h2></div>;

  return (
    <div className="container mx-auto p-4">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Share-Wear — Give What You Can, Take What You Need</h1>
          <p className="text-lg md:text-xl mb-6 text-blue-100">A simple community marketplace for donating and requesting household items and clothing.</p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="bg-white text-blue-700 font-semibold px-5 py-3 rounded shadow">Get Started</Link>
            <Link to="/" className="bg-white/20 text-white font-medium px-5 py-3 rounded">Browse Donations</Link>
          </div>
        </div>
      </section>

      <h2 className="text-3xl font-bold text-center mb-6">Available Donations</h2>

      <div className="max-w-xl mx-auto mb-6">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q); }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items or description" className="flex-grow border rounded px-3 py-2" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
        </form>
      </div>

      {(!Array.isArray(donations) || donations.length === 0) ? (
        <p className="text-center text-gray-500">No donations available at the moment. Please check back later!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((donation) => (
            <DonationCard
              key={donation._id}
              donation={donation}
              onDonationUpdate={() => {}}
              isSaved={savedIds.includes(donation._id)}
              onToggleSaved={(id, nowSaved) => {
                setSavedIds(prev => nowSaved ? [...prev, id] : prev.filter(x => x !== id));
              }}
            />
          ))}
        </div>
      )}

      {/* Simple pagination controls (optional) */}
      <div className="flex justify-center mt-6 gap-3">
        <button
          className="px-3 py-1 rounded bg-gray-200"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="px-3 py-1">Page {page} / {totalPages}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HomePage;