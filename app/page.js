"use client"
import React, { useEffect, useState } from 'react';
import './page.css'; // Import your CSS file here
import LoadingAnimation from '@/app/components/spinner'; // Import your spinner component

export default function Home() {
  const [contestData, setContestData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define currentTime at the beginning
  const currentTime = new Date();

  // Function to check if a contest has started, ended, or not yet started
  const getContestStatus = (contest) => {
    if (currentTime < new Date(contest.startTime)) {
      return `Start Time: ${new Date(contest.startTime).toLocaleString()}`;
    } else if (currentTime > new Date(contest.endTime)) {
      return 'Ended';
    } else {
      return `Started, Ends: ${new Date(contest.endTime).toLocaleString()}`;
    }
  };

  // Use useEffect to fetch contest data when the component mounts
  useEffect(() => {
    async function getContests() {
      fetch('http://89.147.236.58:8000/api/contests', {
        next: {
          revalidate: 1,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setContestData(data); // Set the contest data in state
          setIsLoading(false); // Mark loading as complete
        })
        .catch((error) => {
          console.error('Error fetching contest data:', error);
          setIsLoading(false); // Mark loading as complete in case of error
        });
    }
    getContests();
  }, []); // Empty dependency array to run the effect once on mount

  if (isLoading) {
    // Render loading spinner in the center of the screen
    return (
      <div className="loadingContainer">
        <div className="centered">
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  return (
    <main className="main">
      <div className="contestContainer">
        <p>Contests:</p>
        {/* Map over contest data to generate contest cards */}
        {contestData.map((contest) => (
          <div key={contest._id}>
            {currentTime > new Date(contest.endTime) ? (
              // If the contest has ended, display a disabled contest card
              <div className="contestCard disabled">
                <div className="contestInfo">
                  <h2>{contest.name}</h2>
                  <p className="author">Author: {contest.author}</p>
                </div>
                <div className="contestTime">
                  <p>{getContestStatus(contest)}</p>
                </div>
              </div>
            ) : (
              // If the contest is ongoing or not yet started, display an active contest card
              <a href={`/contest/${contest._id}`} className="contestCard" key={contest._id}>
                <div className="contestInfo">
                  <h2>{contest.name}</h2>
                  <p className="author">Author: {contest.author}</p>
                </div>
                <div className="contestTime">
                  <p>{getContestStatus(contest)}</p>
                </div>
              </a>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
