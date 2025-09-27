const express = require('express');
const Poll = require('../models/Poll');
const router = express.Router();

// GET /api/polls - Get all polls
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/polls request received');
    const polls = await Poll.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${polls.length} polls`);
    res.json(polls);
  } catch (error) {
    console.error('❌ Error fetching polls:', error);
    res.status(500).json({ 
      message: 'Error fetching polls',
      error: error.message 
    });
  }
});

// POST /api/polls - Create a new poll
router.post('/', async (req, res) => {
  try {
    console.log('📥 POST /api/polls request received:', req.body);
    
    const { question, options, createdBy } = req.body;
    
    // Validation
    if (!question || !question.trim()) {
      return res.status(400).json({ 
        message: 'Poll question is required' 
      });
    }
    
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 options are required' 
      });
    }
    
    // Create new poll
    const newPoll = new Poll({
      question: question.trim(),
      options: options.map(option => ({ 
        text: option.trim(), 
        votes: 0 
      })),
      createdBy: createdBy ? createdBy.trim() : 'Anonymous'
    });
    
    const savedPoll = await newPoll.save();
    console.log('✅ Poll saved successfully:', savedPoll._id);
    
    // ✅ REAL-TIME: Emit socket event for new poll
    const io = req.app.get('io');
    io.emit('pollCreated', savedPoll);
    console.log('📢 New poll broadcasted to all clients');
    
    res.status(201).json(savedPoll);
  } catch (error) {
    console.error('❌ Error creating poll:', error);
    res.status(500).json({ 
      message: 'Error creating poll',
      error: error.message 
    });
  }
});

// POST /api/polls/:id/vote - Vote on a poll
router.post('/:id/vote', async (req, res) => {
  try {
    console.log('🗳️ Vote request received for poll:', req.params.id);
    console.log('🗳️ Vote data:', req.body);
    
    const { optionIndex, voterId } = req.body;
    
    // Validation
    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return res.status(400).json({ 
        message: 'Invalid option index' 
      });
    }
    
    if (!voterId || !voterId.trim()) {
      return res.status(400).json({ 
        message: 'Voter ID is required' 
      });
    }
    
    // Find the poll
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ 
        message: 'Poll not found' 
      });
    }
    
    // Check if voter already voted
    if (poll.voters && poll.voters.includes(voterId)) {
      return res.status(400).json({ 
        message: 'You have already voted on this poll' 
      });
    }
    
    // Check if option index is valid
    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ 
        message: 'Invalid option index' 
      });
    }
    
    // Update the vote count
    poll.options[optionIndex].votes += 1;
    
    // Add voter to voters list
    if (!poll.voters) {
      poll.voters = [];
    }
    poll.voters.push(voterId);
    
    // Save the updated poll
    const updatedPoll = await poll.save();
    
    console.log('✅ Vote saved successfully for poll:', updatedPoll._id);
    
    // ✅ REAL-TIME: Emit socket event to all connected clients
    const io = req.app.get('io');
    io.to(req.params.id).emit('voteUpdate', updatedPoll);
    console.log(`📢 Real-time update sent for poll: ${req.params.id}`);
    
    res.json(updatedPoll);
  } catch (error) {
    console.error('❌ Error processing vote:', error);
    res.status(500).json({ 
      message: 'Error processing vote',
      error: error.message 
    });
  }
});

module.exports = router;