import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import CreatePoll from './components/CreatePoll.js';
import PollList from './components/PollList.js';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
    
    socket.on('pollCreated', (newPoll) => {
      setPolls(prev => [newPoll, ...prev]);
    });

    socket.on('voteUpdate', (updatedPoll) => {
      setPolls(prev => prev.map(poll => 
        poll._id === updatedPoll._id ? updatedPoll : poll
      ));
    });

    return () => {
      socket.off('pollCreated');
      socket.off('voteUpdate');
    };
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/polls');
      setPolls(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🗳️ Real-Time Polling App</h1>
        <p>Create polls and see results in real-time!</p>
      </header>

      <main className="app-main">
        <CreatePoll />
        {loading ? (
          <div className="loading">Loading polls...</div>
        ) : (
          <PollList polls={polls} />
        )}
      </main>
    </div>
  );
}

export default App;