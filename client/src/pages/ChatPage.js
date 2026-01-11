import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
  const { id } = useParams(); // conversation id
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [text, setText] = useState('');

  const fetchConv = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get(`/api/conversations/${id}`, config).catch(() => ({ data: null }));
      // fallback: try listing and find
      if (!data) {
        const list = await api.get('/api/conversations', config);
        const found = list.data.find(c => c._id === id);
        setConv(found || null);
      } else setConv(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchConv(); }, [id, user]);

  const send = async () => {
    if (!text.trim() || !user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.post(`/api/conversations/${id}/messages`, { text }, config);
      setConv(data);
      setText('');
    } catch (err) { console.error(err); }
  };

  if (!conv) return <div className="p-6">Loading conversation...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Chat about: {conv.donation?.title || 'Item'}</h2>
      <div className="border rounded mb-4 p-3 h-64 overflow-auto bg-white">
        {conv.messages.map(m => (
          <div key={m._id || m.createdAt} className={`mb-2 ${m.sender === user._id ? 'text-right' : 'text-left'}`}>
            <div className="inline-block bg-gray-100 p-2 rounded">{m.text}</div>
            <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-grow border rounded px-3 py-2" />
        <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
