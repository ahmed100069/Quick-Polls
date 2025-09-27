import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import CreatePoll from './components/CreatePoll';
import PollList from './components/PollList';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const socket = io(API_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function App() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    console.log('🚀 [FRONTEND] App component mounted');
    fetchPolls();
    
    socket.on('connect', () => {
      console.log('✅ [FRONTEND] Socket connected successfully');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ [FRONTEND] Socket disconnected');
      setSocketConnected(false);
    });

    socket.on('pollCreated', (newPoll) => {
      console.log('📢 [FRONTEND] New poll created via socket:', newPoll);
      setPolls(prev => [newPoll, ...prev]);
      joinPollRoom(newPoll._id);
    });

    socket.on('voteUpdate', (updatedPoll) => {
      console.log('📢 [FRONTEND] Real-time vote update received:', updatedPoll);
      setPolls(prev => prev.map(poll => 
        poll._id === updatedPoll._id ? updatedPoll : poll
      ));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pollCreated');
      socket.off('voteUpdate');
    };
  }, []);

  const joinPollRoom = (pollId) => {
    if (socketConnected && pollId) {
      socket.emit('join-poll', pollId);
    }
  };

  const leavePollRoom = (pollId) => {
    if (socketConnected && pollId) {
      socket.emit('leave-poll', pollId);
    }
  };

  const fetchPolls = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/api/polls`, {
        timeout: 10000
      });
      
      if (response.data && Array.isArray(response.data)) {
        setPolls(response.data);
        response.data.forEach(poll => {
          joinPollRoom(poll._id);
        });
      } else {
        setPolls([]);
      }
      
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching polls:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout: Server is taking too long to respond');
      } else if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Please try again'}`);
      } else if (error.request) {
        setError('Cannot connect to server. Please check if backend is running on port 5000.');
      } else {
        setError(`Error: ${error.message}`);
      }
      
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPoll = (newPoll) => {
    setPolls(prev => [newPoll, ...prev]);
    joinPollRoom(newPoll._id);
    socket.emit('newPoll', newPoll);
  };

  const handleVoteUpdate = (updatedPoll) => {
    setPolls(prev => prev.map(poll => 
      poll._id === updatedPoll._id ? updatedPoll : poll
    ));
  };

  const retryFetchPolls = () => {
    fetchPolls();
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Real-Time Polling App</h1>
        <p>Create polls and see results instantly</p>
        
        {/* Connection Status */}
        <div className="connection-status">
          Status: {socketConnected ? 'Connected' : 'Disconnected'}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button 
                onClick={retryFetchPolls}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="app-main">
        <CreatePoll onPollCreated={handleNewPoll} />
        
        {loading ? (
          <div className="loading-state">
            <div>Loading polls...</div>
            <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
              Please wait while we fetch the latest polls
            </div>
          </div>
        ) : (
          <PollList 
            polls={polls} 
            onVote={handleVoteUpdate}
            onJoinPollRoom={joinPollRoom}
            onLeavePollRoom={leavePollRoom}
          />
        )}
      </main>

      <footer className="app-footer">
        <div>Backend: {API_URL}</div>
        <div>Polls loaded: {polls.length}</div>
        <div>Status: {loading ? 'Loading...' : error ? 'Error' : 'Ready'}</div>
      </footer>
    </div>
  );
}

export { socket };
export default App;