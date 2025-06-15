import React, { useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';

const ExampleComponent: React.FC = () => {
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example of fetching maids
  const fetchMaids = async () => {
    try {
      setLoading(true);
      const response = await apiClient.maid.getAllMaids();
      setMaids(response.data);
    } catch (err) {
      setError('Failed to fetch maids');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Example of creating a booking
  const createBooking = async (bookingData: any) => {
    try {
      const response = await apiClient.booking.createBooking(bookingData);
      console.log('Booking created:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to create booking:', err);
      throw err;
    }
  };

  // Example of user login
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiClient.auth.login({ email, password });
      // Store the token
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMaids();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Maids List</h1>
      {/* Render your maids data here */}
    </div>
  );
};

export default ExampleComponent; 