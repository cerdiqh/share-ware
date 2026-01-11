import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const DonationCard = ({ donation, onDonationUpdate, isSaved = false, onToggleSaved }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(isSaved);

  useEffect(() => { setSaved(isSaved); }, [isSaved]);

  const toggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (!saved) {
        await api.post(`/api/users/saved/${donation._id}`, {}, config);
        setSaved(true);
        if (onToggleSaved) onToggleSaved(donation._id, true);
      } else {
        await api.delete(`/api/users/saved/${donation._id}`, config);
        setSaved(false);
        if (onToggleSaved) onToggleSaved(donation._id, false);
      }
    } catch (err) {
      console.error('Failed to toggle save', err);
    }
  };

  const handleRequest = async () => {
    if (!user) {
      alert('You must be logged in to request an item.');
      navigate('/login');
      return;
    }

    if (donation.donor && user._id === (donation.donor._id || donation.donor).toString()) {
      alert("You cannot request your own donation.");
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const response = await api.put(
        `/api/donations/${donation._id}/request`,
        {},
        config
      );

      alert('Request successful! The donor will be notified.');
      
      if (onDonationUpdate) {
        onDonationUpdate(response.data);
      }

    } catch (error) {
      console.error('Failed to request donation:', error.response.data.message);
      alert(`Error: ${error.response.data.message}`);
    }
  };

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Build image src robustly: prefer `donation.images` (thumbnail), fallback to `imagePath`.
  const backendOrigin = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  let imgSrc = '';
  if (donation) {
    // Prefer images array (new format)
    if (Array.isArray(donation.images) && donation.images.length > 0) {
      const first = donation.images[0];
      const candidate = first.thumbnail || first.image || first;
      imgSrc = typeof candidate === 'string' && candidate.startsWith('http') ? candidate : `${backendOrigin}${candidate}`;
    } else if (donation.imagePath) {
      imgSrc = donation.imagePath.startsWith('http') ? donation.imagePath : `${backendOrigin}${donation.imagePath}`;
    }
  }

  // Use native <img> load/error handlers to decide whether to show image

  return (
    <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={donation.title}
          className="w-full h-48 object-cover"
          onLoad={() => { setImgLoaded(true); setImgError(false); }}
          onError={(e) => { console.error('Image load error', imgSrc, e); setImgError(true); setImgLoaded(false); }}
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
      )}

      {/* Debug info to help diagnose missing images */}
      <div className="p-2 text-xs text-gray-600 break-words">
        <div className="mb-1">imgSrc: {imgSrc ? (
          <span>
            <span className="mr-2 break-all">{imgSrc}</span>
            <a href={imgSrc} target="_blank" rel="noreferrer" className="text-blue-600 mr-2">open</a>
            <button onClick={() => { navigator.clipboard?.writeText(imgSrc); alert('Copied image URL'); }} className="text-xs px-2 py-1 bg-gray-200 rounded">Copy</button>
          </span>
        ) : 'none'}</div>
        <div>loaded: {imgLoaded ? 'yes' : 'no'} • error: {imgError ? 'yes' : 'no'}</div>
      </div>

      <div className="p-4 flex-grow">
        <h3 className="text-xl font-bold mb-2">
          <Link to={`/donations/${donation._id}`} className="hover:underline">{donation.title}</Link>
        </h3>
        <p className="text-gray-700 mb-4">{donation.description}</p>
        <div className="text-sm text-gray-500">
          <p>Donated by: {donation.donor ? donation.donor.fullname : 'Anonymous'}</p>
        </div>
      </div>
      
      <div className="p-4 bg-white">
        <Link to={`/donations/${donation._id}`} className="inline-block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded">View Details</Link>
      </div>

      <div className="p-2 px-4 bg-white">
        <button onClick={toggleSave} className={`w-full ${saved ? 'bg-green-500 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white font-bold py-2 px-4 rounded`}>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Conditional Button Rendering */}
      {user && user.role === 'recipient' && (
        <div className="p-4 bg-gray-50">
          <button
            onClick={handleRequest}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Request This Item
          </button>
        </div>
      )}
    </div>
  );
};

export default DonationCard;
