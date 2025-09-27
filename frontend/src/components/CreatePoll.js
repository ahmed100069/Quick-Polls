import React, { useState } from 'react';
import axios from 'axios';
import './CreatePoll.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CreatePoll = ({ onPollCreated }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [createdBy, setCreatedBy] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!question.trim()) {
      setError('Please enter a poll question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('Please add at least 2 options');
      return;
    }

    setIsCreating(true);

    try {
      const response = await axios.post(`${API_URL}/api/polls`, {
        question: question.trim(),
        options: validOptions,
        createdBy: createdBy.trim() || 'Anonymous'
      });

      if (onPollCreated) {
        onPollCreated(response.data);
      }

      setQuestion('');
      setOptions(['', '']);
      setCreatedBy('');
      setError('');
      alert('Poll created successfully!');
    } catch (error) {
      console.error('Error creating poll:', error);
      
      if (error.response) {
        setError(`Server error: ${error.response.data?.message || 'Please try again'}`);
      } else if (error.request) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-poll-container">
      <div className="create-poll-card">
        <h2 className="create-poll-title">Create New Poll</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="poll-form">
          <div className="form-group">
            <label className="form-label">Poll Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your favorite programming language?"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Options</label>
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                  className="option-input"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="remove-option-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addOption}
              className="add-option-btn"
            >
              + Add Option
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Your Name (optional)</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Anonymous"
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={isCreating}
            className="submit-poll-btn"
          >
            {isCreating ? 'Creating...' : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;