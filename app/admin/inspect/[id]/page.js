"use client"
import React, { useState, useEffect } from 'react';
import Spinner from '@/app/components/spinner';


export default function ContestInspectPage({params}) {
  const {id} = params
  const [contestData, setContest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the contest ID is available in the query parameters
    if (id) {
      // Fetch contest data using the contest ID from the query parameters
      async function fetchContest() {
        try {
          setLoading(true); // Set loading to true when fetching data
          const response = await fetch(`http://89.147.236.58:8000/api/contest/${id}`);
          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
          }
          const contestData = await response.json();
          setContest(contestData);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false); // Set loading to false when data is fetched (regardless of success or error)
        }
      }

      fetchContest();
    }
  }, [id]);

  return (
    <div className="contest-inspect-container">
      {loading ? (
        // Display a loading spinner while fetching data
        <div className="loading-spinner">
          <img src="spinner.gif" alt="Loading" />
        </div>
      ) : error ? (
        // Display an error message if there's an error
        <div className="error-message">Error: {error.message}</div>
      ) : contestData ? (
        // Display the contest data if available
        <div className="contest-details">
          <h1>{contestData.name}</h1>
          <p className="description">{contestData.description}</p>
          <p>Author: {contestData.author}</p>
          <p>Start Time: {new Date(contestData.startTime).toLocaleString()}</p>
          <p>End Time: {new Date(contestData.endTime).toLocaleString()}</p>

          <h2>Allowed Users:</h2>
          <ul>
            {contestData.allowedUsers.map((user) => (
              <li key={user.userId}>
                <p>Username: {user.username}</p>
                <p>Password: {user.password}</p>
                <h3>Submissions:</h3>
                <ul>
                  {user.submissions.map((submission) => (
                    <li key={submission._id}>
                      <p>Question ID: {submission.questionId}</p>
                      <p>Result: {submission.result}</p>
                      <p>File Path: {submission.filePath}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <h2>Questions:</h2>
          <ul>
            {contestData.questions.map((question) => (
              <li key={question.questionId}>
                <p>Question ID: {question.questionId}</p>
                <p>Name: {question.name}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // Display a message if no data is available
        <div>No contest data available.</div>
      )}
    </div>
  );
}
