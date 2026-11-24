"use client"
import { useEffect, useState } from 'react';
import "./page.css"
export default function AdminDashboard() {
  const [contests, setContests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContests() {
      try {
        const response = await fetch('http://89.147.236.58:8000/api/contests'); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        const contestsData = await response.json();
        setContests(contestsData);
      } catch (error) {
        setError(error);
      }
    }

    fetchContests();
  }, []);

  return (
      <div className="admin-dashboard-container">
        <h1 className="dashboard-title">Admin Dashboard</h1>

      {/* Display Contests */}
      {error ? (
        <div className="error-message">Error: {error.message}</div>
      ) : (
        <div className="contests-list">
          {contests.map((contest) => (
            <a key={contest._id} href={`/admin/inspect/${contest._id}`} className="contest-card">
              <h2 className="contest-name">{contest.name}</h2>
              <p className="contest-description">{contest.description}</p>
              <p className="contest-author">Author: {contest.author}</p>
              {/* Add more contest details as needed */}
            </a>
          ))}
        </div>
      )}

      {/* Add Contest Button */}
      <button className="add-contest-button" onClick={() => handleAddContestClick()}>
        Add Contest
      </button>
    </div>
  );
}

// Function to handle "Add Contest" button click
function handleAddContestClick() {
  // Implement logic to navigate to the "Add Contest" page
  // You can use Next.js routing or any other preferred method
}
