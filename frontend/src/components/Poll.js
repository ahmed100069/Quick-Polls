import React, { useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Poll = ({ poll }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voterId] = useState(() => localStorage.getItem(`voter_${poll._id}`) || `voter_${Date.now()}`);

  React.useEffect(() => {
    localStorage.setItem(`voter_${poll._id}`, voterId);
    if (poll.voters.includes(voterId)) {
      setHasVoted(true);
    }
  }, [poll._id, poll.voters, voterId]);

  const handleVote = async () => {
    if (selectedOption === null) return;

    try {
      await axios.post(`http://localhost:5000/api/polls/${poll._id}/vote`, {
        optionIndex: selectedOption,
        voterId: voterId
      });
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const chartData = poll.options.map((option, index) => ({
    name: option.text,
    value: option.votes,
    percentage: totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="poll">
      <h3>{poll.question}</h3>
      <p className="poll-meta">
        Created by {poll.createdBy} • {new Date(poll.createdAt).toLocaleDateString()}
      </p>

      {!hasVoted ? (
        <div className="poll-voting">
          <div className="options">
            {poll.options.map((option, index) => (
              <div key={index} className="option">
                <label>
                  <input
                    type="radio"
                    name={`poll-${poll._id}`}
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                  />
                  {option.text}
                </label>
              </div>
            ))}
          </div>
          <button 
            onClick={handleVote} 
            disabled={selectedOption === null}
            className="vote-btn"
          >
            Vote
          </button>
        </div>
      ) : (
        <div className="poll-results">
          <h4>Results ({totalVotes} votes):</h4>
          <div className="results-container">
            <div className="results-list">
              {poll.options.map((option, index) => (
                <div key={index} className="result-item">
                  <div className="result-bar">
                    <div 
                      className="result-fill"
                      style={{
                        width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                  <span className="result-text">
                    {option.text}: {option.votes} votes (
                      {totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0}%
                    )
                  </span>
                </div>
              ))}
            </div>
            
            {totalVotes > 0 && (
              <div className="results-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${percentage}%`}
                      outerRadius={80}
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
        </div>
      )}
    </div>
  );
};

export default Poll;