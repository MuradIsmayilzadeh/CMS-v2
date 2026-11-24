"use client"
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // For handling cookies
import Spinner from '../components/spinner';
import "./page.css";

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check if the adminLoggedIn cookie is set to 'true'
    const isAdminLoggedIn = Cookies.get('adminLoggedIn') === 'true';

    if (isAdminLoggedIn) {
      // If the admin is already logged in, you can automatically navigate to the admin dashboard
      // Here, you can handle the navigation based on your specific routing setup
      // For example, using React Router or another routing library
      // Replace '/admin-dashboard' with the actual URL for the admin dashboard
      window.location.href = '/admin-dashboard';
    } else {
      // Admin is not logged in, so we can stop showing the loading animation
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    try {
      // Send a POST request to your server to validate admin credentials
      const response = await fetch('http://89.147.236.58:8000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Set a cookie to indicate that the admin is logged in
        Cookies.set('adminLoggedIn', 'true', { expires: 1 }); // Cookie expires in 1 day
        // Navigate to the admin dashboard upon successful login
        // Replace '/admin-dashboard' with the actual URL for the admin dashboard
        window.location.href = '/admin-dashboard';
      } else {
        // Handle authentication error, display an error message, etc.
        setErrorMessage('Invalid username or password.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      // Handle fetch error, display an error message, etc.
    }
  };

  return (
    <div className="admin-login-container">
      {isLoading ? ( // Show loading animation if isLoading is true
            <Spinner/>
      ) : (
        // Show login form if isLoading is false
        <>
          <h1>Admin Login</h1>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button className='login-button' onClick={handleLogin}>Login</button>
        </>
      )}
    </div>
  );
}
