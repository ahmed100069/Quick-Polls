import React from 'react';
import Poll from './Poll';
import './PollList.css';

const PollList = ({ polls, onVote, onJoinPollRoom, onLeavePollRoom }) => {
  // ✅ SAFETY CHECK - polls array exists and is valid
  if (!polls || !Array.isArray(polls)) {
    return (
      <div className="no-polls-container">
        <div className="no-polls-card">
          <h3>No polls available</h3>
          <p>Create the first poll to get started!</p>
        </div>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="no-polls-container">
        <div className="no-polls-card">
          <h3>No polls yet</h3>
          <p>Be the first to create a poll!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-list-container">
      <h2 className="poll-list-title">Recent Polls</h2>
      <div className="polls-grid">
        {polls.map((poll) => (
          <Poll 
            key={poll._id || Math.random()} 
            poll={poll} 
            onVote={onVote}
            onJoinPollRoom={onJoinPollRoom}
            onLeavePollRoom={onLeavePollRoom} 
          />
        ))}
      </div>
    </div>
  );
};

export default PollList;