import React from 'react';
import Poll from './Poll.js';

const PollList = ({ polls }) => {
  if (polls.length === 0) {
    return (
      <div className="no-polls">
        <h3>No polls yet. Be the first to create one!</h3>
      </div>
    );
  }

  return (
    <div className="poll-list">
      <h2>Current Polls</h2>
      {polls.map(poll => (
        <Poll key={poll._id} poll={poll} />
      ))}
    </div>
  );
};

export default PollList;