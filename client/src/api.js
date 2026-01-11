import axios from 'axios';

const api = axios.create({
  // When developing, the CRA proxy will forward requests to the backend.
  // For production set REACT_APP_API_URL to the backend origin.
  baseURL: process.env.REACT_APP_API_URL || '',
});

export default api;
