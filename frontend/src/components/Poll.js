import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { socket } from '../App';
import './Poll.css';

const Poll = ({ poll, onVote, onJoinPollRoom, onLeavePollRoom }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  
  useEffect(() => {
    if (poll && poll._id && onJoinPollRoom) {
      onJoinPollRoom(poll._id);
    }
    
    return () => {
      if (poll && poll._id && onLeavePollRoom) {
        onLeavePollRoom(poll._id);
      }
    };
  }, [poll, onJoinPollRoom, onLeavePollRoom]);

  const getVoterId = () => {
    if (!poll || !poll._id) return `voter_${Date.now()}`;
    return localStorage.getItem(`voter_${poll._id}`) || `voter_${Date.now()}`;
  };

  const [voterId] = useState(getVoterId);

  useEffect(() => {
    if (!poll || !poll._id) return;
    
    localStorage.setItem(`voter_${poll._id}`, voterId);
    
    if (poll.voters && Array.isArray(poll.voters) && poll.voters.includes(voterId)) {
      setHasVoted(true);
    }
  }, [poll, poll?._id, poll?.voters, voterId]);

  const handleVote = async () => {
    if (selectedOption === null || !poll || !poll._id || voting) return;

    try {
      setVoting(true);
      
      const updatedPoll = {
        ...poll,
        options: poll.options.map((opt, idx) => 
          idx === selectedOption 
            ? { ...opt, votes: (opt.votes || 0) + 1 }
            : opt
        ),
        voters: [...(poll.voters || []), voterId]
      };
      
      if (onVote) {
        onVote(updatedPoll);
      }
      
      setHasVoted(true);
      
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
        await axios.post(`${API_URL}/api/polls/${poll._id}/vote`, {
          optionIndex: selectedOption,
          voterId: voterId
        }, {
          timeout: 5000
        });
      } catch (backendError) {
        console.warn('Backend vote save failed:', backendError.message);
      }
      
    } catch (error) {
      console.error('Error in voting process:', error);
      alert('Vote failed. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  if (!poll || !poll.options) {
    return (
      <div className="poll-container">
        <div className="poll-card">
          <div className="loading-poll">Loading poll data...</div>
        </div>
      </div>
    );
  }

  const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  const chartData = poll.options.map((option, index) => ({
    name: option.text || `Option ${index + 1}`,
    value: option.votes || 0,
    percentage: totalVotes > 0 ? (((option.votes || 0) / totalVotes) * 100).toFixed(1) : 0
  }));

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

  return (
    <div className="poll-container">
      <div className="poll-card">
        <h3 className="poll-question">{poll.question || 'No question'}</h3>
        
        <div className="poll-meta">
          <span className="poll-creator">By {poll.createdBy || 'Anonymous'}</span>
          <span className="poll-date">
            {poll.createdAt ? new Date(poll.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Unknown date'}
          </span>
        </div>

        {!hasVoted ? (
          <div className="poll-voting-section">
            <div className="options-container">
              {poll.options.map((option, index) => (
                <div key={index} className="option-item">
                  <label className="option-label">
                    <input
                      type="radio"
                      name={`poll-${poll._id}`}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                      className="option-radio"
                    />
                    <span className="option-text">{option.text || `Option ${index + 1}`}</span>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="vote-action">
              <button 
                onClick={handleVote} 
                disabled={selectedOption === null || voting}
                className="vote-button"
              >
                {voting ? 'Voting...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        ) : (
          <div className="poll-results-section">
            <div className="results-header">
              <h4 className="results-title">Poll Results</h4>
              <span className="total-votes">{totalVotes} total votes</span>
            </div>
            
            <div className="results-content">
              <div className="results-list">
                {poll.options.map((option, index) => (
                  <div key={index} className="result-item">
                    <div className="result-info">
                      <span className="result-option">{option.text || `Option ${index + 1}`}</span>
                      <span className="result-stats">
                        {option.votes || 0} votes • {totalVotes > 0 ? (((option.votes || 0) / totalVotes) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="result-bar-container">
                      <div 
                        className="result-bar-fill"
                        style={{
                          width: `${totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalVotes > 0 && (
                <div className="results-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percentage }) => `${percentage}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            <div className="vote-thankyou">
              <p>Thank you for voting! Results update in real-time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Poll;