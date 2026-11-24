import React, { useEffect, useState } from 'react';
import './shower.css';

export default function ContestShower({ contestId }) {
  const [contest, setContest] = useState({});
  const [remainingTime, setRemainingTime] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [results, setResults] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState([]); // Store user-specific submissions

  // Function to calculate remaining time
  const calculateRemainingTime = (endTime) => {
    const currentTime = new Date().getTime();
    const timeDifference = endTime - currentTime;
    console.log(endTime )
    return timeDifference > 0 ? timeDifference : 0;
  };

  useEffect(() => {
    const fetchContestData = async () => {
      try {
        const response = await fetch(`http://89.147.236.58:8000/api/contest/${contestId}`, {
          next: {
            revalidate: 1,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        const contestData = await response.json();
        setContest(contestData);
      } catch (error) {
        console.error('Error fetching contest data:', error);
      }
    };

    fetchContestData();
  }, [contestId]);

  useEffect(() => {
    if (contest && contest.endTime) {
      const endTime = new Date(contest.endTime).getTime();
      const interval = setInterval(() => {
        setRemainingTime(calculateRemainingTime(endTime));
      }, 1000);

      setRemainingTime(calculateRemainingTime(endTime));
      console.log(endTime)

      return () => {
        clearInterval(interval);
      };
    }
  }, [contest]);

  const handleSidebarButtonClick = (buttonType) => {
    if (buttonType === 'home') {
      setSelectedQuestion(null);
      setResults({});
      setUserSubmissions([]);
    }
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestion(questionId);
    setResults({});
    setUserSubmissions([]); // Clear user-specific submissions when changing questions
  };

  const handleDownloadCondition = () => {
    const conditionUrl = contest.questions.find((q) => q.questionId === selectedQuestion)?.conditionUrl;
    if (conditionUrl) {
      window.open(conditionUrl, '_blank');
    }
  };

  const handleDownloadFile = (filePath) => {
    window.open(`http://89.147.236.58:8000/files/${filePath}`, '_blank');
  };

  // Handle file input change
  const handleResultChange = (event) => {
    const questionId = selectedQuestion;
    const file = event.target.files[0];

    setResults({ ...results, [questionId]: file });
  };

  const handleSubmitFile = async () => {
    try {
      if (!results[selectedQuestion]) {
        alert('Please select a file before submitting.');
        return;
      }

      const userId = localStorage.getItem('contestAuthToken');
      const reader = new FileReader();

      // Create an object to send to the server
      const requestData = {
        userId,
        questionId: selectedQuestion,
        fileContent: reader.readAsText(results[selectedQuestion]), // Send the file content as a string
      };
      const response = await fetch(`http://89.147.236.58:8000/api/contest/${contest._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData), // Send the data as JSON
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      setSelectedQuestion(null);
      setResults({});
      setSubmitting(false);

      alert('File submitted successfully!');
    } catch (error) {
      console.error('Error submitting file:', error);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Update user-specific submissions when selectedQuestion changes
    if (selectedQuestion !== null) {
      const userId = localStorage.getItem('contestAuthToken');
      const user = contest.allowedUsers.find((user) => user.userId === userId);
      if (user) {
        const userSubmissionsForQuestion = user.submissions.filter((s) => s.questionId === selectedQuestion);
        setUserSubmissions(userSubmissionsForQuestion);
      }
    } else {
      setUserSubmissions([]);
    }
  }, [selectedQuestion, contest]);

  if (!contest) {
    return <div>No contest data available.</div>;
  }

  const questions = contest.questions || [];

  return (
    <div className="contest-container">
            <div className="sidebar">
            <h2>Home</h2>
            <button className="home-button" onClick={() => handleSidebarButtonClick('home')}>
              Home
            </button>
            <h2>Questions</h2>
            <ul>
              {questions.map((question) => (
                <li key={question.questionId}>
                  <button
                    className={`question-button ${selectedQuestion === question.questionId ? 'selected' : ''}`}
                    onClick={() => handleQuestionSelect(question.questionId)}
                  >
                    {question.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="content">
            {selectedQuestion === null ? (
              <>
                <h1>{contest.name}</h1>
                <p>{contest.description}</p>
                <p>Author: {contest.author}</p>
                {remainingTime > 0 && (
                  <div className="remaining-time">
                    <h2>Remaining Time:</h2>
                    <div className="cool-watch">{formatRemainingTime(remainingTime)}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="question-content">
                <h2>Question: {selectedQuestion}</h2>
                <button className="download-condition-button" onClick={handleDownloadCondition}>
                  Download Condition PDF
                </button>
                <div className="result-input">
                  <label htmlFor={selectedQuestion}>Upload .cpp File for {selectedQuestion}:</label>
                  <input
                    type="file"
                    id={selectedQuestion}
                    accept=".cpp"
                    onChange={handleResultChange}
                  />
                </div>
                <button className="submit-button" onClick={handleSubmitFile} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit File'}
                </button>
                <div className="submissions">
                  {userSubmissions.map((submission, index) => (
                    <div className="submission-container" key={`${submission.questionId}_${index}`}>
                      {submission.username}
                      <div className="submission-info"></div>
                      <div className="submission">
                        <div className="submission-percentage">
                          {submission.result}%
                        </div>
                        <div className="submission-file">
                          <button onClick={() => handleDownloadFile(submission.filePath)}>
                            Download and Install
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
    </div>
  );
}

function formatRemainingTime(remainingTime) {
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  const formattedTime = [];

  if (days > 0) {
    formattedTime.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    formattedTime.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    formattedTime.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0) {
    formattedTime.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return formattedTime.join(' ');
}
