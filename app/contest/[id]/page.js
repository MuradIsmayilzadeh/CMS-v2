"use client"
import React, { useEffect, useState } from 'react';
import './ContestDetail.css';
import ContestShower from './contestShower';
import LoadingAnimation from "../../components/spinner"

export default function ContestDetail({ params }) {
  const { id } = params;

  // State for login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State for contest data
  const [contest, setContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to handle login
  const login = async (loginUsername, loginPassword) => {
    try {
      const response = await fetch(`http://89.147.236.58:8000/api/contest/${id}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const res = await response.json();
      console.log(res._id)
      localStorage.setItem('contestAuthToken', res._id);
      localStorage.setItem('contestLogin', JSON.stringify({ username: loginUsername, password: loginPassword }));
      setIsLoggedIn(true);

      fetchContestData(res._id);
    } catch (err) {
      setError(err);
    }
  };

  // Function to fetch contest data
  const fetchContestData = (authToken) => {
    fetch(`http://89.147.236.58:8000/api/contest/${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
      })
      .then((contestData) => {
        setContest(contestData);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const storedData = localStorage.getItem('contestLogin');
    const storedToken = localStorage.getItem('contestAuthToken');
    console.log(storedToken)
    if (storedData && storedToken) {
      const { username: storedUsername, password: storedPassword } = JSON.parse(storedData);
      setUsername(storedUsername);
      setPassword(storedPassword);
      setIsLoggedIn(true);
      fetchContestData(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Function to handle login button click
  const handleLoginClick = () => {
    login(username, password);
  };

  if (isLoading) return <div className="loadingContainer"><LoadingAnimation /></div>;

  if (!isLoggedIn) {
    return (
      <div className="centered-container">
        <div className="loginForm">
          <h2>Login to Contest</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLoginClick}>Login</button>
        </div>
      </div>
    );
  }

  if (error) return <div className="loadingContainer">{error.message}</div>;

  // Render ContestShower only if isLoggedIn is true
  return (
    <ContestShower contestId={id} />
  );
}
