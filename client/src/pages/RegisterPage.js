import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook

const RegisterPage = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  
  const { login } = useAuth(); // Get the login function from our context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newUser = {
        fullname,
        email,
        password,
        role,
      };

      const response = await api.post('/api/users/register', newUser);

      // --- Use the context to handle login ---
      // This will automatically log the user in after they register
      login(response.data);

      alert('Registration successful! You are now logged in.');
      console.log('Registered user:', response.data);
      // Redirect based on role
      if (response.data.role === 'donor') {
        navigate('/dashboard');
      } else if (response.data.role === 'recipient') {
        // Direct recipients to the homepage to browse items
        navigate('/');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Registration failed:', error.response.data.message);
      alert(`Registration failed: ${error.response.data.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
      <form onSubmit={handleSubmit}>
        {/* Full Name Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="fullname">
            Full Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="fullname"
            type="text"
            placeholder="John Doe"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            required
          />
        </div>

        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">I want to:</label>
          <div className="flex items-center">
            <input type="radio" id="donor" name="role" value="donor" checked={role === 'donor'} onChange={(e) => setRole(e.target.value)} className="mr-2" />
            <label htmlFor="donor" className="mr-4">Donate Items</label>
            
            <input type="radio" id="recipient" name="role" value="recipient" checked={role === 'recipient'} onChange={(e) => setRole(e.target.value)} className="mr-2" />
            <label htmlFor="recipient">Receive Items</label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
