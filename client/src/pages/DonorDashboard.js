import React from 'react';
import { useAuth } from '../context/AuthContext';
import AddDonationForm from '../components/AddDonationForm';
import MyDonationsList from '../components/MyDonationsList'; // Import it

const DonorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to your Dashboard, {user.fullname}!
      </h1>
      <p className="mb-6">This is your personal space to manage your donations.</p>
      
      <AddDonationForm />

      {/* Add a divider and the new list component */}
      <hr className="my-8" />
      <MyDonationsList />
      
    </div>
  );
};

export default DonorDashboard;
