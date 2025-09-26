import React, { useState } from 'react';
import axios from 'axios';

const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [createdBy, setCreatedBy] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
    
    if (!question.trim() || options.some(opt => !opt.trim())) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);

    try {
      await axios.post('http://localhost:5000/api/polls', {
        question,
        options: options.filter(opt => opt.trim()),
        createdBy: createdBy.trim() || 'Anonymous'
      });

      setQuestion('');
      setOptions(['', '']);
      setCreatedBy('');
      alert('Poll created successfully!');
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-poll">
      <h2>Create New Poll</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Poll Question:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's your favorite programming language?"
            required
          />
        </div>

        <div className="form-group">
          <label>Options:</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption} className="add-option-btn">
            + Add Option
          </button>
        </div>

        <div className="form-group">
          <label>Your Name (optional):</label>
          <input
            type="text"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Anonymous"
          />
        </div>

        <button type="submit" disabled={isCreating} className="submit-btn">
          {isCreating ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;